const path = require('path');
const { forEachPackage } = require('./monorepo/for-each-package');
const { updatePackageJson } = require('./monorepo/update-package-json');

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
  return pkgJson;
}

async function main() {
  let allDeps = new Map();

  await forEachPackage(async ({ packageJson, location }) => {
    const leafygreenDeps = new Map(
      Object.entries(packageJson.dependencies || {}).filter(([key]) =>
        key.startsWith('@leafygreen-ui/')
      )
    );

    if (leafygreenDeps.size > 0) {
      allDeps = new Map([...allDeps, ...leafygreenDeps]);
      await updatePackageJson(location, (pkgJson) => {
        pkgJson.peerDependencies = {
          ...pkgJson.peerDependencies,
          ...Object.fromEntries(leafygreenDeps)
        };
        sortDepsByName(pkgJson);
        return pkgJson;
      });
    }
  });

  await updatePackageJson(
    path.resolve(__dirname, '..', 'packages', 'compass'),
    (pkgJson) => {
      pkgJson.dependencies = {
        ...pkgJson.dependencies,
        ...Object.fromEntries(allDeps)
      };
      sortDepsByName(pkgJson);
      return pkgJson;
    }
  );
}

main();
