const path = require('path');
const { promises: fs } = require('fs');
const prompts = require('prompts');
const pacote = require('pacote');

const {
  collectWorkspacesDependencies,
  collectWorkspacesMeta,
  updatePackageJson,
  withProgress,
  runInDir,
  getHighestRange,
} = require('@mongodb-js/monorepo-tools');

function packageNameToDir(pkgName) {
  return pkgName ? pkgName.replace(/^@mongodb-js\//, '') : pkgName;
}

function dirToScopedPackageName(dir, scope) {
  if (!scope) {
    return dir;
  }

  return dir.startsWith(`${scope}/`) ? dir : `${scope}/${dir}`;
}

async function main(argv) {
  let workspaceNameFromArgs = argv[0];
  const workspacesMeta = await collectWorkspacesMeta();
  const dirs = Array.from(workspacesMeta.values()).map(({ location }) =>
    path.basename(location)
  );
  const names = Array.from(workspacesMeta.values()).map(({ name }) => name);

  const nameExists = (pkgName) => {
    return dirs.includes(packageNameToDir(pkgName)) || names.includes(pkgName);
  };

  console.log();

  if (nameExists(workspaceNameFromArgs)) {
    console.warn(
      `⚠️  Workspace with the name "%s" already exists, please choose another name`,
      workspaceNameFromArgs
    );
    console.warn();
    workspaceNameFromArgs = null;
  }

  if (workspaceNameFromArgs) {
    console.log('Setting up new workspace "%s"', workspaceNameFromArgs);
    console.log();
  }

  let canceled = false;

  let {
    name = workspaceNameFromArgs,
    description = '',
    isPlugin = false,
    isConfig = false,
    isPublic = true,
    isReact = true,
    dependants = [],
    depType,
  } = await prompts(
    [
      {
        type: workspaceNameFromArgs ? null : 'text',
        name: 'name',
        message: 'Provide a name for the new workspace',
        hint: '(this name will be part of the package name)',
        validate(value) {
          if (!value) {
            return 'Workspace name is required';
          }

          if (nameExists(value)) {
            return `Workspace name "${value}" is already taken. Please provide another name`;
          }

          return true;
        },
      },
      {
        type: 'text',
        name: 'description',
        message: 'Provide a one-line description of the workspace',
      },
      {
        type: 'confirm',
        name: 'isPlugin',
        message: 'Are you creating a new Compass plugin?',
        initial: true,
      },
      {
        type(_, { name, description, isPlugin }) {
          if (isPlugin) {
            return null;
          }

          const regex = /\bconfig\b/i;
          return regex.test(name) || regex.test(description) ? 'confirm' : null;
        },
        name: 'isConfig',
        message: 'Is it a shared configuration package?',
        hint: '(answering yes will create the package in the ./configs/<package-name> directory)',
        initial: true,
      },
      {
        type(_, { isPlugin }) {
          if (isPlugin) {
            return null;
          }

          return 'confirm';
        },
        name: 'isPublic',
        message: 'Is it a public package?',
        initial: false,
      },
      {
        type(_, { isPlugin }) {
          if (isPlugin) {
            return null;
          }

          return 'confirm';
        },
        name: 'isReact',
        message: 'Will the package use React?',
        initial: true,
      },
      {
        type(_, { isPlugin }) {
          if (isPlugin) {
            return null;
          }

          return 'autocompleteMultiselect';
        },
        name: 'dependants',
        message: 'Will any of the packages in the monorepo depend on this one?',
        choices: Array.from(workspacesMeta.values())
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(({ name, location }) => ({ title: name, value: location })),
        hint: '(select as many as you like, or none)',
        instructions: `

 · Use up and down arrows to navigate the list
 · Use space to toggle the selection
 · Type text to filter choices
 · Enter to complete the answer
`,
        initial: [],
      },
      {
        type(prev) {
          return prev.length > 0 ? 'select' : null;
        },
        name: 'depType',
        message: 'What type of dependency is it?',
        choices: [
          { title: 'Production', value: 'dependencies' },
          { title: 'Development', value: 'devDependencies' },
        ],
      },
    ],
    {
      onCancel() {
        canceled = true;
      },
    }
  );

  if (canceled) {
    return;
  }

  if (isPlugin) {
    isReact = true;
  }

  console.log();

  await createWorkspace({
    name,
    scope: '@mongodb-js',
    description,
    isPublic,
    isPlugin,
    isReact,
    workspacesMeta,
    isConfig,
    dependants,
    depType,
  });
}

const BestMatchCache = new Map();

async function createWorkspace({
  name: workspaceName,
  scope,
  description,
  isPublic,
  isPlugin,
  isReact,
  workspacesMeta,
  isConfig,
  dependants,
  depType,
  allowJs,
}) {
  if (isPlugin) {
    isPublic = false;
  }

  const pkgJson = {
    name: dirToScopedPackageName(workspaceName, scope),
    ...(description && { description }),
    author: {
      name: 'MongoDB Inc',
      email: 'compass@mongodb.com',
    },
    ...(isPublic ? { publishConfig: { access: 'public' } } : { private: true }),
    bugs: {
      url: 'https://jira.mongodb.org/projects/COMPASS/issues',
      email: 'compass@mongodb.com',
    },
    homepage: 'https://github.com/mongodb-js/compass',
    version: '1.0.0',
    repository: {
      type: 'git',
      url: 'https://github.com/mongodb-js/compass.git',
    },
    files: ['dist'],
    license: 'SSPL',
    main: 'dist/index.js',
    'compass:main': 'src/index.ts',
    exports: {
      import: './dist/.esm-wrapper.mjs',
      require: './dist/index.js',
    },
    'compass:exports': {
      '.': './src/index.ts',
    },
    types: './dist/index.d.ts',
    scripts: {
      bootstrap: 'npm run compile',
      ...(isPublic && {
        prepublishOnly:
          'npm run compile && compass-scripts check-exports-exist',
      }),
      compile: isPublic
        ? 'tsc -p tsconfig.json && gen-esm-wrapper . ./dist/.esm-wrapper.mjs'
        : 'tsc -p tsconfig.json',
      typecheck: 'tsc -p tsconfig-lint.json --noEmit',
      eslint: 'eslint',
      prettier: 'prettier',
      lint: 'npm run eslint . && npm run prettier -- --check .',
      depcheck: 'compass-scripts check-peer-deps && depcheck',
      check: 'npm run typecheck && npm run lint && npm run depcheck',
      'check-ci': 'npm run check',
      test: 'mocha',
      ...(isPlugin && {
        'test-electron': 'xvfb-maybe electron-mocha --no-sandbox',
      }),
      'test-cov':
        'nyc --compact=false --produce-source-map=false -x "**/*.spec.*" --reporter=lcov --reporter=text --reporter=html npm run test',
      'test-watch': 'npm run test -- --watch',
      'test-ci': 'npm run test-cov',
      ...(isPlugin && { 'test-ci-electron': 'npm run test-electron' }),
      reformat: 'npm run eslint . -- --fix && npm run prettier -- --write .',
    },
    ...(isReact && { dependencies: { react: '*', 'react-dom': '*' } }),
    devDependencies: {
      '@mongodb-js/eslint-config-compass': '*',
      '@mongodb-js/mocha-config-compass': '*',
      '@mongodb-js/prettier-config-compass': '*',
      '@mongodb-js/tsconfig-compass': '*',
      '@types/chai': '*',
      '@types/mocha': '*',
      '@types/sinon-chai': '*',
      chai: '*',
      depcheck: '*',
      eslint: '*',
      mocha: '*',
      nyc: '*',
      prettier: '*',
      sinon: '*',
      ...(isReact && {
        '@mongodb-js/testing-library-compass': '*',
        '@types/chai-dom': '*',
        '@types/react': '*',
        '@types/react-dom': '*',
      }),
      typescript: '*',
      ...(isPublic && { 'gen-esm-wrapper': '*' }),
      ...(isPlugin && {
        'hadron-app-registry': '*',
        'xvfb-maybe': '*',
      }),
    },
    ...(isPlugin && { is_compass_plugin: true }),
  };

  await applyBestVersionMatch(pkgJson, workspacesMeta);
  // Otherwise npm will do this on next install and generate an unwanted diff
  sortDepsByName(pkgJson);

  const packagePath = path.resolve(
    __dirname,
    '..',
    isConfig ? 'configs' : 'packages',
    packageNameToDir(workspaceName)
  );

  const packageJsonPath = path.join(packagePath, 'package.json');
  const packageJsonContent = JSON.stringify(pkgJson, null, 2);

  const depcheckrcPath = path.join(packagePath, '.depcheckrc');
  const ignores = [
    '@mongodb-js/prettier-config-compass',
    '@mongodb-js/tsconfig-compass',
    '@types/chai',
    '@types/sinon-chai',
    'sinon',
  ]
    .concat(
      isReact ? ['@types/chai-dom', '@types/react', '@types/react-dom'] : []
    )
    .map((dep) => ` - '${dep}'`)
    .join('\n');
  const depcheckrcContent = `ignores:\n${ignores}\nignore-patterns:\n - 'dist'\n`;

  const prettierrcPath = path.join(packagePath, '.prettierrc.json');
  const prettierrcContent = JSON.stringify(
    '@mongodb-js/prettier-config-compass'
  );

  const prettierIgnorePath = path.join(packagePath, '.prettierignore');
  const prettierIgnoreContent = '.nyc_output\ndist\ncoverage\n';

  const tsconfigPath = path.join(packagePath, 'tsconfig.json');
  const tsconfigContent = JSON.stringify(
    {
      extends: `@mongodb-js/tsconfig-compass/tsconfig.${
        isReact ? 'react' : 'common'
      }.json`,
      compilerOptions: {
        outDir: 'dist',
        allowJs: allowJs === true ? true : undefined,
      },
      include: ['src/**/*'],
      exclude: ['./src/**/*.spec.*'],
    },
    null,
    2
  );

  const tsconfigLintPath = path.join(packagePath, 'tsconfig-lint.json');
  const tsconfigLintContent = JSON.stringify(
    {
      extends: './tsconfig.json',
      include: ['**/*'],
      exclude: ['node_modules', 'dist'],
    },
    null,
    2
  );

  const eslintrcPath = path.join(packagePath, '.eslintrc.js');
  const eslintrcContent = `
module.exports = {
  root: true,
  extends: ['@mongodb-js/eslint-config-compass${isPlugin ? '/plugin' : ''}'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig-lint.json'],
  },
};`;

  const eslintIgnorePath = path.join(packagePath, '.eslintignore');
  const eslintIgnoreContent = '.nyc-output\ndist\n';

  const mocharcPath = path.join(packagePath, '.mocharc.js');
  const mocharcContent = `module.exports = require('${
    isPlugin
      ? '@mongodb-js/mocha-config-compass/compass-plugin'
      : isReact
      ? '@mongodb-js/mocha-config-compass/react'
      : '@mongodb-js/mocha-config-compass'
  }');`;

  const indexSrcDir = path.join(packagePath, 'src');

  const indexSrcPath = path.join(indexSrcDir, 'index.ts');
  const indexSrcContent = isPlugin
    ? `
import { registerHadronPlugin } from "hadron-app-registry";

const Plugin = registerHadronPlugin({
  name: 'Plugin',
  component: () => null,
  activate(initialProps, services, activateHelpers) {
    return {}
  }
});

export default Plugin;
`
    : '';

  const indexSpecPath = path.join(indexSrcDir, 'index.spec.tsx');
  const indexSpecContent = isPlugin
    ? `
import React from 'react';
import { expect } from 'chai';
import { cleanup, render } from '@testing-library/react';
import CompassPlugin from './index';

describe('Compass Plugin', function() {
  const Plugin = CompassPlugin.withMockServices({});

  it('renders a Plugin', function() {
    render(<Plugin></Plugin>)
  });
});
`
    : '';

  await withProgress('Generating package source', async () => {
    await fs.mkdir(packagePath, { recursive: true });
    await fs.writeFile(packageJsonPath, packageJsonContent);
    await fs.writeFile(depcheckrcPath, depcheckrcContent);
    await fs.writeFile(prettierrcPath, prettierrcContent);
    await fs.writeFile(prettierIgnorePath, prettierIgnoreContent);
    await fs.writeFile(tsconfigPath, tsconfigContent);
    await fs.writeFile(tsconfigLintPath, tsconfigLintContent);
    await fs.writeFile(eslintrcPath, eslintrcContent);
    await fs.writeFile(eslintIgnorePath, eslintIgnoreContent);
    await fs.writeFile(mocharcPath, mocharcContent);
    await fs.mkdir(indexSrcDir, { recursive: true });
    await fs.writeFile(indexSrcPath, indexSrcContent);
    await fs.writeFile(indexSpecPath, indexSpecContent);
  });

  if (dependants.length > 0) {
    await withProgress('Updating dependants', async () => {
      for (const location of dependants) {
        await updatePackageJson(location, (pkgJson) => {
          if (!pkgJson[depType]) {
            pkgJson[depType] = {};
          }
          pkgJson[depType][dirToScopedPackageName(workspaceName, scope)] =
            '^0.1.0';
          sortDepsByName(pkgJson, [depType]);
          return pkgJson;
        });
      }
    });
  }

  await withProgress(
    'Updating package-lock and prettifying workspace source',
    async () => {
      await runInDir('npm install');
      await runInDir('npm run prettier -- --write .', packagePath);
    }
  );

  console.log();
  console.log(
    'Workspace is ready at %s',
    path.relative(process.cwd(), packagePath)
  );
  console.log();

  return packagePath;
}

async function resolveLatestVersionFromRegistry(
  depName,
  registry = process.env.npm_config_registry
) {
  try {
    return `^${(await pacote.manifest(depName, { registry })).version}`;
  } catch (e) {
    return '*';
  }
}

async function applyBestVersionMatch(
  pkgJson,
  meta,
  types = ['dependencies', 'devDependencies']
) {
  const dependencies = collectWorkspacesDependencies(meta);

  for (const depType of types) {
    for (const depName in pkgJson[depType]) {
      if (BestMatchCache.has(depName)) {
        pkgJson[depType][depName] = BestMatchCache.get(depName);
      } else {
        const maybeRanges = (dependencies.get(depName) || []).map(
          ({ version }) => version
        );
        pkgJson[depType][depName] =
          getHighestRange(maybeRanges) ||
          (await resolveLatestVersionFromRegistry(depName));

        BestMatchCache.set(depName, pkgJson[depType][depName]);
      }
    }
  }
}

function sortDepsByName(
  pkgJson,
  types = ['dependencies', 'devDependencies', 'peerDependencies']
) {
  for (const depType of types) {
    if (pkgJson[depType]) {
      pkgJson[depType] = Object.fromEntries(
        Object.entries(pkgJson[depType]).sort(([a], [b]) => a.localeCompare(b))
      );
    }
  }
}

process.on('unhandledRejection', (err) => {
  console.error();
  console.error(err.stack || err.message || err);
  process.exitCode = 1;
});

if (require.main === module) {
  main(process.argv.slice(2));
}

module.exports = { createWorkspace };
