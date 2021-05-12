const path = require('path');
const { promises: fs } = require('fs');

async function updatePackageJson(packageDir, updateFn) {
  const pathToPkg = path.resolve(packageDir, 'package.json');
  const pkgJson = require(pathToPkg);
  const updated = updateFn(pkgJson);
  if (!updated || typeof updated !== 'object') {
    const updatedStr = JSON.stringify(updated);
    throw new Error(
      `updatePackageJson updateFn should return a package.json object, got ${updatedStr}`
    );
  }
  await fs.writeFile(
    pathToPkg,
    JSON.stringify(updated, null, 2).trim() + '\n',
    'utf8'
  );
}

exports.updatePackageJson = updatePackageJson;
