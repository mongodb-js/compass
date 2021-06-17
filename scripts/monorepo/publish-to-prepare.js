const { forEachPackage } = require('./for-each-package');
const { updatePackageJson } = require('./update-package-json');
const { withProgress } = require('./with-progress');

async function main() {
  await forEachPackage(async ({ location, packageJson }) => {
    if (
      packageJson.scripts &&
      (packageJson.scripts.prepublishOnly || packageJson.scripts.prepublish)
    ) {
      await withProgress(
        `Updating scripts for package ${packageJson.name}`,
        async () => {
          await updatePackageJson(location, (packageJson) => {
            const prepublish =
              packageJson.scripts.prepublishOnly ||
              packageJson.scripts.prepublish;
            if (packageJson.scripts.prepare) {
              packageJson.scripts.prepare = `${packageJson.scripts.prepare.trim()} && ${prepublish}`;
            } else {
              packageJson.scripts.prepare = prepublish;
            }
            delete packageJson.scripts.prepublishOnly;
            delete packageJson.scripts.prepublish;
            return packageJson;
          });
        }
      );
    }
  });
}

process.on('unhandledRejection', (err) => {
  console.error();
  console.error(err.stack || err.message || err);
});

main();
