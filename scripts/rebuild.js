/**
 * Similar to electorn-rebuild this script will resolve modules that might need
 * a rebuild relative to cwd and rebuild them
 */
const { promises: fs } = require('fs');
const path = require('path');
const pkgUp = require('pkg-up');
const { runInDir, withProgress } = require('@mongodb-js/monorepo-tools');

async function getBinPath(pkgName, resolveFrom = process.cwd()) {
  try {
    const pkgJsonFile = await pkgUp({
      cwd: require.resolve(pkgName, { paths: [resolveFrom] }),
    });
    const { bin } = require(pkgJsonFile);
    const binPath =
      typeof bin === 'string'
        ? bin
        : typeof bin === 'object' && bin !== null
        ? Object.values(bin)[0]
        : null;

    return binPath ? path.resolve(path.dirname(pkgJsonFile), binPath) : null;
  } catch {
    return null;
  }
}

async function exists(path) {
  try {
    await fs.stat(path);
    return true;
  } catch (e) {
    return false;
  }
}

async function getDependenciesFromPackageJson(packagePath = process.cwd()) {
  const {
    dependencies = {},
    devDependencies = {},
    optionalDependencies = {},
  } = require(await pkgUp({ cwd: packagePath }));

  return Array.from(
    new Set([
      ...Object.keys(dependencies),
      ...Object.keys(devDependencies),
      ...Object.keys(optionalDependencies),
    ])
  );
}

async function main() {
  let total = 0;

  const prebuildInstallBin = await getBinPath('prebuild-install');
  const nodeGypBin = await getBinPath('node-gyp');

  let packagesToRebuild = process.argv
    .slice(2)
    .filter((arg) => !arg.startsWith('-'));

  if (packagesToRebuild.length === 0) {
    packagesToRebuild = await getDependenciesFromPackageJson();
  }

  for (const pkgName of packagesToRebuild) {
    let resolvedPath = null;

    try {
      resolvedPath = await fs.realpath(require.resolve(pkgName));
    } catch (e) {
      //
    }

    if (!resolvedPath) {
      continue;
    }

    const packageJsonPath = await pkgUp({ cwd: resolvedPath });
    const packagePath = path.dirname(packageJsonPath);

    const hasNodeGypConfig = await exists(
      path.join(packagePath, 'binding.gyp')
    );

    if (!hasNodeGypConfig) {
      continue;
    }

    await withProgress(`Rebuilding package ${pkgName}`, async function () {
      const spinner = this;
      const spinnerText = spinner.text;

      const packageJson = Object.assign(
        { dependencies: {}, scripts: {} },
        require(packageJsonPath)
      );

      const [maybeRebuildScript = null] =
        Object.entries(packageJson.scripts).find(([name, script]) => {
          return (
            /(post)?install/.test(name) &&
            /(prebuild-install|node-gyp)/.test(script)
          );
        }) || [];

      const hasPrebuildInstall = packageJson.dependencies['prebuild-install'];

      if (maybeRebuildScript) {
        try {
          spinner.text = `${spinnerText} using "npm run ${maybeRebuildScript}"`;

          await runInDir(`npm run ${maybeRebuildScript}`, packagePath);
          total++;
        } catch (e) {
          //
        }
      }

      if (hasPrebuildInstall) {
        try {
          const bin =
            prebuildInstallBin ||
            (await getBinPath('prebuild-install', packagePath));

          spinner.text = `${spinnerText} using prebuild-install`;

          await runInDir(`node ${bin}`, packagePath);
          total++;
        } catch (e) {
          //
        }
      }

      const bin = nodeGypBin || (await getBinPath('node-gyp', packagePath));

      spinner.text = `${spinnerText} using node-gyp`;

      await runInDir(`node ${bin} rebuild`, packagePath);
      total++;
    });
  }

  if (total === 0) {
    console.log('Nothing to rebuild');
  }
}

process.on('unhandledRejection', (err) => {
  console.error();
  console.error(err.stack || err.message || err);
  process.exitCode = 1;
});

main();
