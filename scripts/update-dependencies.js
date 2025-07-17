'use strict';
const fs = require('fs');
const path = require('path');
const { isEqual, cloneDeep } = require('lodash');
const {
  listAllPackages,
  runInDir,
  updatePackageJson,
  findMonorepoRoot,
  withProgress,
} = require('@mongodb-js/monorepo-tools');

const UPDATE_CONFIGS = require('./update-dependencies-config');

async function hoistSharedDependencies(root, newVersions) {
  try {
    await withProgress('Cleaning up existing node_modules', async () => {
      await runInDir("npx lerna exec 'rm -Rf node_modules'", root);
      await runInDir('rm -Rf node_modules', root);
    });

    const packageJsonBkp = await withProgress(
      'Updating package-lock to apply package.json changes',
      async () => {
        await runInDir('npm i --package-lock-only --ignore-scripts', root);
        return await fs.promises.readFile(path.resolve(root, 'package.json'));
      }
    );

    await withProgress(
      'Installing new dependencies at root to make sure they are hoisted',
      async () => {
        const versionsToInstall = newVersions
          .map((spec) => {
            return spec.join('@');
          })
          .join(' ');
        await runInDir(
          `npm i ${versionsToInstall} --package-lock-only --ignore-scripts`,
          root
        );
      }
    );

    await withProgress(
      'Cleaning-up hoisted `dependencies` from root package.json',
      async () => {
        await fs.promises.writeFile(
          path.resolve(root, 'package.json'),
          packageJsonBkp
        );
        await runInDir('npm i', root);
      }
    );
  } catch (error) {
    console.error(`Error running command: ${error}`);
  }
}

async function getVersion(depSpec) {
  const [name, versionSpec = 'latest'] = depSpec.split(
    /(?<!^)@/ // split by version, avoid splitting by optional namespace
  );
  const { stdout: output } = await runInDir(
    `npm view ${name}@${versionSpec} version --json`
  );
  const parsed = JSON.parse(output);
  const version = Array.isArray(parsed) ? parsed.pop() : parsed;
  return [name, version.trim()];
}

function updateDependencies(packageJson, newVersions) {
  for (const depType of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ]) {
    if (packageJson[depType]) {
      for (const packageName of Object.keys(packageJson[depType])) {
        if (packageJson[depType][packageName] && newVersions[packageName]) {
          packageJson[depType][packageName] = `^${newVersions[packageName]}`;
        }
      }
    }
  }
}

/**
 * example overrides config:
 *
 * {
 *   "overrides": {
 *     "@npm/foo": "1.0.0",
 *     "@npm/bar": {
 *       ".": "1.0.0",
 *       "@npm/buz": "1.0.0"
 *     },
 *     "@npm/a": {
 *       "@npm/b": {
 *         "@npm/c": "1.0.0"
 *       }
 *     }
 *   }
 * }
 *
 * https://docs.npmjs.com/cli/v11/configuring-npm/package-json#overrides
 */
function updateOverrides(overrides, newVersions, parent) {
  for (const name of Object.keys(overrides ?? {})) {
    if (typeof overrides[name] === 'string' && newVersions[name]) {
      overrides[name] = `^${newVersions[name]}`;
    } else if (name === '.' && parent && newVersions[parent]) {
      overrides[name] = `^${newVersions[name]}`;
    } else if (typeof overrides[name] === 'object') {
      updateOverrides(overrides[name], newVersions, name);
    }
  }
}

async function main() {
  let dependencies;

  const args = process.argv.slice(3);

  if (args.length === 0) {
    throw new Error(
      'Missing dependencies list. Provide a list of dependencies to update or a preset name:\n\n  npx compass-scripts update-dependencies <package[@version-range] [...packages] | preset>'
    );
  }

  if (args[0].startsWith('preset-')) {
    const presetName = args[0].replace('preset-', '');
    dependencies = UPDATE_CONFIGS[args[0].replace('preset-', '')];
    if (!dependencies) {
      throw new Error(
        `Can not find update config for preset "${presetName}". Available presets: ${Object.keys(
          UPDATE_CONFIGS
        ).join(', ')}`
      );
    }
    console.log();
    console.log('Running update for preset "%s" ...', presetName);
    console.log();
  } else {
    dependencies = args;
  }

  const newVersions = await withProgress(
    `Collection version information for packages...`,
    () => {
      return Promise.all(
        dependencies.map((depSpec) => {
          return getVersion(depSpec);
        })
      );
    }
  );

  console.log();
  console.log(
    'Updating following packages:\n\n * %s\n',
    newVersions
      .map((spec) => {
        return spec.join('@');
      })
      .join('\n * ')
  );
  console.log();

  const newVersionsObj = Object.fromEntries(newVersions);
  let hasChanged;

  const monorepoRoot = await findMonorepoRoot();
  const workspaces = [monorepoRoot].concat(
    await Array.fromAsync(listAllPackages(), (workspace) => workspace.location)
  );

  await withProgress('Updating package.json in workspaces', async () => {
    for (const workspacePath of workspaces) {
      await updatePackageJson(workspacePath, (packageJson) => {
        const origPackageJson = cloneDeep(packageJson);
        updateDependencies(packageJson, newVersionsObj);
        updateOverrides(packageJson.overrides, newVersionsObj);
        hasChanged = hasChanged || !isEqual(origPackageJson, packageJson);
        return packageJson;
      });
    }
  });

  if (!hasChanged) {
    console.log();
    console.log('Everything is up to date, exiting ...');
    return;
  }

  await hoistSharedDependencies(monorepoRoot, newVersions);

  console.log();
  console.log('Successfully updated dependencies');
}

main();
