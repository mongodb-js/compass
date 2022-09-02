const { forEachPackage } = require('./scripts/monorepo/for-each-package');
const { updatePackageJson } = require('./scripts/monorepo/update-package-json');

function maybeUpdatePackage(packageJson, name, version) {
  let updated = false;
  for (const depType of [
    'dependencies',
    'devDependencies',
    'peerDependencies'
  ]) {
    if (packageJson[depType] && packageJson[depType][name]) {
      packageJson[depType][name] = version;
      updated = true;
    }
  }
  return updated;
}

async function main() {
  await forEachPackage(async ({ location }) => {
    await updatePackageJson(location, (packageJson, skip) => {
      const updated = [
        maybeUpdatePackage(packageJson, 'redux', '^4.2.0'),
        maybeUpdatePackage(packageJson, 'react-redux', '^8.0.2'),
        maybeUpdatePackage(packageJson, 'react', '^17.0.2'),
        maybeUpdatePackage(packageJson, 'react-dom', '^17.0.2')
      ].some(Boolean);
      return updated ? packageJson : skip;
    });
  });
}

main();
