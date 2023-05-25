const path = require('path');
const { promises: fs } = require('fs');
const { glob } = require('glob');
const {
  pluginExternals,
  sharedExternals,
} = require('@mongodb-js/webpack-config-compass');

function getImportsFromSourceString(sourceString) {
  const imports = [];
  const regexp =
    // A non-type import or a require statement
    /(?:(?:^|\n)import\s(?!type)[\s\S]*?("|')(?<import>[^\1]+?)\1|require(?:\.resolve)?\(("|')(?<require>[^\3]+?)\3\))/g;
  let match = regexp.exec(sourceString);
  while (match !== null) {
    imports.push(match.groups.import ?? match.groups.require);
    match = regexp.exec(sourceString);
  }
  return Array.from(new Set(imports))
    .map((name) => {
      // Keep second part for namespaced imports, but drop everything else
      const [a, b] = name.split('/');
      return a.startsWith('@') ? `${a}/${b}` : a;
    })
    .filter((name) => !name.startsWith('.'));
}

async function getImportsForPackage(cwd = process.cwd()) {
  const sourceFiles = await glob('src/**/*.{ts,tsx,js,jsx}', {
    cwd: cwd,
    ignore: '**/*.{test,spec}.{ts,tsx,js,jsx}',
  });
  const imports = (
    await Promise.all(
      sourceFiles.map(async (filePath) => {
        const fileContent = await fs.readFile(path.join(cwd, filePath), 'utf8');
        return getImportsFromSourceString(fileContent);
      })
    )
  ).flat();
  return new Set(imports);
}

async function main() {
  const packageJson = require(path.resolve(process.cwd(), 'package.json'));
  const requiredPeerDep = new Set([...sharedExternals, ...pluginExternals]);
  const sourceImports = await getImportsForPackage();
  const prodDependencies = Object.keys(packageJson.dependencies ?? {});
  const peerDependencies = Object.keys(packageJson.peerDependencies ?? {});
  const devDependencies = Object.keys(packageJson.devDependencies ?? {});
  const expectedPeerDependencies = new Set(
    Array.from(sourceImports).filter((name) => {
      return requiredPeerDep.has(name);
    })
  );
  // On request from cloud team we are making react/react-dom an exception
  // from the common rule and only keep them as peer dependencies
  // even when they should be a prod dependency.
  const excludedFromProdDependencies = new Set(['react', 'react-dom']);
  const missingInPeerDeps = Array.from(expectedPeerDependencies).filter(
    (name) => {
      return !peerDependencies.includes(name);
    }
  );
  const extraneousInPeerDeps = peerDependencies.filter((name) => {
    return !expectedPeerDependencies.has(name);
  });
  const peerDependenciesWithoutReact = peerDependencies.filter((name) => {
    return !excludedFromProdDependencies.has(name);
  });
  const extraneousInProdDeps = prodDependencies.filter((name) => {
    return excludedFromProdDependencies.has(name);
  });
  const extraneousInDevDeps = devDependencies.filter((name) => {
    return (
      expectedPeerDependencies.has(name) &&
      !excludedFromProdDependencies.has(name)
    );
  });
  const prodDependenciesMatching =
    peerDependenciesWithoutReact.length === prodDependencies.length &&
    peerDependenciesWithoutReact.every((name) => {
      return prodDependencies.includes(name);
    });

  const hasErrors =
    missingInPeerDeps.length > 0 ||
    extraneousInPeerDeps.length > 0 ||
    extraneousInDevDeps.length > 0 ||
    !prodDependenciesMatching;

  if (!hasErrors) {
    console.log('No peer dependencies issues');
    return;
  }

  const header = `Errors found in the ${packageJson.name} package.json dependencies description`;
  const missingPeer =
    missingInPeerDeps.length > 0 &&
    `Following dependencies are missing from peerDependencies:\n\n ${missingInPeerDeps.join(
      ', '
    )}`;
  const extraneousPeer =
    extraneousInPeerDeps.length > 0 &&
    `Following dependencies should not be in peerDependencies:\n\n ${extraneousInPeerDeps.join(
      ', '
    )}`;
  const extraneousProd =
    extraneousInProdDeps.length > 0 &&
    `Following dependencies should be only in peer dependencies (not in prod):\n\n ${extraneousInProdDeps.join(
      ', '
    )}`;
  const extraneousDev =
    extraneousInDevDeps.length > 0 &&
    `Following dev dependencies should be peer dependencies:\n\n ${extraneousInDevDeps.join(
      ', '
    )}`;
  const prodMismatch =
    !prodDependenciesMatching &&
    'Package `peerDependencies` should match `dependencies`';

  const message = [
    header,
    missingPeer,
    extraneousPeer,
    extraneousProd,
    extraneousDev,
    prodMismatch,
  ]
    .filter(Boolean)
    .join('\n\n');

  console.error(message);
  process.exitCode = 1;
}

process.on('unhandledRejection', (err) => {
  console.error();
  console.error(err.stack || err.message || err);
  process.exitCode = 1;
});

main();
