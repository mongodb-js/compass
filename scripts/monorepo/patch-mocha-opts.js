const path = require('path');
const { promises: fs } = require('fs');
const { withProgress } = require('./with-progress');

const ROOT = path.resolve(__dirname, '..', '..');

async function runPatch() {
  const packagesDir = path.resolve(ROOT, 'packages');
  const packages = (await fs.readdir(packagesDir)).map((dir) =>
    path.join(packagesDir, dir)
  );

  const filesToCheck = ['test/mocha.opts', 'mocha-webpack.opts'];

  for (const pkgDir of packages) {
    const packageJson = require(path.join(pkgDir, 'package.json'));

    if (
      (packageJson.dependencies && packageJson.dependencies.mocha) ||
      (packageJson.devDependencies && packageJson.devDependencies.mocha)
    ) {
      await withProgress(
        `Patching mocha opts for package ${packageJson.name}`,
        async function () {
          // First one is always the one we want to patch (if it was found that is)
          const [configPath] = (
            await Promise.all(
              filesToCheck.map(async (filePath) => {
                try {
                  const fullPath = path.join(pkgDir, filePath);
                  await fs.access(fullPath);
                  return fullPath;
                } catch (e) {
                  return false;
                }
              })
            )
          ).filter(Boolean);

          if (configPath) {
            let opts = await fs.readFile(configPath, 'utf8');
            if (/--timeout/.test(opts)) {
              opts.replace(/--timeout\s\d+/, '--timeout 15000');
            } else {
              opts = opts.trim() + '\n--timeout 15000\n';
            }
            await fs.writeFile(configPath, opts, 'utf8');
          } else {
            await fs.writeFile(
              path.join(pkgDir, 'test/mocha.opts'),
              '--timeout 15000\n',
              'utf8'
            );
          }
        }
      );
    }
  }

  console.log();
  console.log('All done');
}

process.on('unhandledRejection', (err) => {
  console.error();
  console.error(err.stack || err.message || err);
});

runPatch();
