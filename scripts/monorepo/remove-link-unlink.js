const { forEachPackage } = require('./for-each-package');
const { updatePackageJson } = require('./update-package-json');

forEachPackage(async ({ packageJson, location }) => {
  const scriptsWithLinkUnlink = Object.entries(packageJson.scripts || {})
    .filter(([, val]) => /(link.sh|run-in-compass.js)$/.test(val))
    .map(([key]) => key);

  if (scriptsWithLinkUnlink.length > 0) {
    await updatePackageJson(location, (packageJson) => {
      scriptsWithLinkUnlink.forEach((key) => {
        delete packageJson.scripts[key];
      });
      return packageJson;
    });
  }
});
