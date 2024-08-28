'use strict';
const path = require('path');
const { promises: fs } = require('fs');
const { traverse, parseAsync } = require('@babel/core');
const { Module } = require('module');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { minVersion } = require('semver');

const execFileAsync = promisify(execFile);

async function resolveFile(importPath) {
  const tried = [];
  for (const basepath of [importPath, path.join(importPath, 'index')]) {
    for (const ext of ['.tsx', '.ts', '.jsx', '.js']) {
      try {
        const filepath = `${basepath}${ext}`;
        tried.push(filepath);
        await fs.stat(filepath);
        return filepath;
      } catch {
        // Ignore the error, we'll throw our own error if we encounter one
      }
    }
  }
  throw new Error(
    `Can not resolve file import "${importPath}". Tried:\n\n${tried
      .map((path) => {
        return ` - ${path}`;
      })
      .join('\n')}`
  );
}

const IGNORED_ABSOLUTE_IMPORTS = [...Module.builtinModules];

async function collectAllAbsoluteImports(entryPoints = []) {
  const relativeImports = new Set(entryPoints);
  const absoluteImports = new Set();
  async function addImport(parentPath, importPath) {
    const parentDir = path.dirname(parentPath);
    // There is probably a better way to check for relative imports...
    if (importPath.startsWith('.')) {
      // Skip non-js imports, we don't care about those
      if (path.extname(importPath) && !/\.(ts|tsx|js|jsx)^/.test(importPath)) {
        return;
      }
      importPath = path.resolve(parentDir, importPath);
      relativeImports.add(await resolveFile(importPath));
    } else {
      // Keep second part for namespaced imports, but drop everything else
      const [a, b] = importPath.split('/');
      const moduleName = a.startsWith('@') ? `${a}/${b}` : a;
      if (IGNORED_ABSOLUTE_IMPORTS.includes(moduleName)) {
        return;
      }
      absoluteImports.add(moduleName);
    }
  }
  for (const sourcePath of relativeImports) {
    const queue = [];
    const queueImport = (importPath) => {
      queue.push(addImport(sourcePath, importPath));
    };
    const source = await fs.readFile(sourcePath, 'utf-8');
    const program = await parseAsync(source, {
      filename: sourcePath,
      presets: [
        require.resolve('@babel/preset-env'),
        require.resolve('@babel/preset-react'),
        require.resolve('@babel/preset-typescript'),
      ],
      plugins: [
        [
          require.resolve('@babel/plugin-proposal-decorators'),
          { version: '2023-01' },
        ],
      ],
    });
    traverse(program, {
      ImportDeclaration(path) {
        queueImport(path.node.source.value);
      },
      ExportNamedDeclaration(path) {
        if (path.node.source) {
          queueImport(path.node.source.value);
        }
      },
      ExportAllDeclaration(path) {
        queueImport(path.node.source.value);
      },
      CallExpression(path) {
        if (
          path.node.callee.type === 'Identifier' &&
          (path.node.callee.name === 'require' ||
            path.node.callee.name === 'import') &&
          path.node.arguments.length === 1 &&
          (path.node.arguments[0].type === 'Literal' ||
            path.node.arguments[0].type === 'StringLiteral')
        ) {
          queueImport(path.node.arguments[0].value);
        }

        if (
          path.node.callee.type === 'MemberExpression' &&
          path.node.callee.object.type === 'Identifier' &&
          path.node.callee.object.value === 'require' &&
          path.node.callee.property.type === 'Identifier' &&
          path.node.callee.property.value === 'resolve' &&
          path.node.arguments.length === 1
        ) {
          if (
            path.node.arguments[0].type === 'Literal' ||
            path.node.arguments[0].type === 'StringLiteral'
          ) {
            queueImport(path.node.arguments[0].value);
          } else {
            // Warn about dynamic import?
          }
        }
      },
      noScope: true,
    });
    await Promise.all(queue);
  }
  return absoluteImports;
}

async function getImportsForPackage(pkgJson, cwd = process.cwd()) {
  const entryPoints = pkgJson['compass:exports']
    ? Object.values(pkgJson['compass:exports'])
    : pkgJson['compass:main']
    ? [pkgJson['compass:main']]
    : (() => {
        throw new Error(
          `Expected "${pkgJson.name}" package to have a special "compass:" entrypoint`
        );
      })();

  if (pkgJson.types) {
    try {
      await execFileAsync('git', ['check-ignore', pkgJson.types], { cwd });
    } catch {
      // If ^ failed, file is not ignored (written by hand most probably), let's
      // check its dependencies too
      entryPoints.push(pkgJson.types);
    }
  }

  return await collectAllAbsoluteImports(
    entryPoints
      .filter((entry) => {
        return !/(test|spec).tsx?$/.test(entry);
      })
      .map((entry) => {
        return path.resolve(cwd, entry);
      })
  );
}

async function main() {
  const pkgJsonPath = path.resolve(process.cwd(), 'package.json');
  const pkgJson = require(path.resolve(process.cwd(), 'package.json'));
  const prodDependencies = new Set(Object.keys(pkgJson.dependencies ?? {}));
  const peerDependencies = new Set(Object.keys(pkgJson.peerDependencies ?? {}));
  const devDependencies = new Set(Object.keys(pkgJson.devDependencies ?? {}));
  const allDependenciesWithVersions = new Map(
    Object.entries({
      ...(pkgJson.dependencies ?? {}),
      ...(pkgJson.peerDependencies ?? {}),
      ...(pkgJson.devDependencies ?? {}),
    })
  );

  const expectedPropDeps = await getImportsForPackage(pkgJson);

  const shouldBeInDev = new Set();
  const shouldBeInProd = new Set();
  const shouldNotBeDuplicated = new Set();

  for (const depName of new Set([
    ...prodDependencies,
    ...devDependencies,
    ...expectedPropDeps,
  ])) {
    if (prodDependencies.has(depName) + devDependencies.has(depName) > 1) {
      shouldNotBeDuplicated.add(depName);
    }

    if (expectedPropDeps.has(depName) && !prodDependencies.has(depName)) {
      shouldBeInProd.add(depName);
    }

    if (!expectedPropDeps.has(depName) && !devDependencies.has(depName)) {
      shouldBeInDev.add(depName);
    }
  }

  const hasPeerDeps = peerDependencies.size > 0;

  const hasErrors =
    shouldNotBeDuplicated.size > 0 ||
    shouldBeInProd.size > 0 ||
    shouldBeInDev.size > 0 ||
    hasPeerDeps;

  if (!hasErrors) {
    console.log(
      `No issues with dependencies grouping in ${pkgJson.name} package.json found`
    );
    return;
  }

  const list = (preMessage, items, postMessage) => {
    return `${preMessage}\n\n${items
      .map((item) => {
        return ` - ${item}`;
      })
      .join('\n')}${postMessage ? `\n\n${postMessage}` : ''}`;
  };

  const errorMessage = [
    `Errors found in the ${pkgJson.name} package.json dependencies grouping!`,
    hasPeerDeps &&
      `Peer dependencies are not allowed. All peer dependencies should be listed in package dependencies.`,
    shouldNotBeDuplicated.size > 0 &&
      list(
        'Following dependencies are duplicated:',
        Array.from(shouldNotBeDuplicated),
        'Make sure these dependencies are only listed once in package.json'
      ),
    shouldBeInProd.size > 0 &&
      list(
        'Following dependencies should be listed as prod dependencies as they are used in the package source:',
        Array.from(shouldBeInProd)
      ),
    shouldBeInDev.size > 0 &&
      list(
        'Following dependencies should be listed as dev dependencies as they are not used in source:',
        Array.from(shouldBeInDev)
      ),
  ]
    .filter(Boolean)
    .join('\n\n');

  const autofix = process.argv.includes('--autofix');
  const logErrors = autofix ? console.warn : console.error;

  logErrors(errorMessage);
  logErrors();

  if (!autofix) {
    process.exitCode = 1;
    return;
  }

  console.log(
    'The `--autofix` flag was provided. Attempting to autofix the issues.'
  );
  console.log();

  function verionToInstall(name) {
    const version = allDependenciesWithVersions.get(name);
    const normalisedVersion = (() => {
      try {
        return minVersion(version);
      } catch {
        return version;
      }
    })();
    return version ? `${name}@${normalisedVersion}` : name;
  }

  const prodDepsToInstall = Array.from(shouldBeInProd).map((name) => {
    return verionToInstall(name);
  });

  const devDepsToInstall = Array.from(shouldBeInDev).map((name) => {
    return verionToInstall(name);
  });

  if (hasPeerDeps) {
    const {
      // Removing peerDeps from package.json
      // eslint-disable-next-line no-unused-vars
      peerDependencies: _peerDeps,
      ...pkgJsonWithoutPeerDeps
    } = pkgJson;

    console.log(' - Removing peerDependencies from package.json ...');
    await fs.writeFile(
      pkgJsonPath,
      JSON.stringify(pkgJsonWithoutPeerDeps, null, 2)
    );
  }

  if (prodDepsToInstall.length > 0) {
    console.log(' - Moving prod dependencies to `dependecies` ...');
    await execFileAsync('npm', [
      'install',
      '--save-prod',
      ...prodDepsToInstall,
    ]);
  }

  if (devDepsToInstall.length) {
    console.log(' - Moving dev dependencies to `devDependecies` ...');
    await execFileAsync('npm', ['install', '--save-dev', ...devDepsToInstall]);
  }

  console.log();
  console.log('All done!');
}

process.on('unhandledRejection', (err) => {
  console.error();
  console.error(err.stack || err.message || err);
  process.exitCode = 1;
  process.exit();
});

main();
