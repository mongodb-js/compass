const path = require('path');
const { promises: fs } = require('fs');

const skip = Symbol('skip');

function insertAfter(obj, key, insertKey, insertValue) {
  const keys = Object.keys(obj);
  keys.splice(keys.indexOf(key) + 1, 0, insertKey);
  return Object.fromEntries(
    keys.map((key) => [key, key === insertKey ? insertValue : obj[key]])
  );
}

function sortKeys(obj) {
  const keys = Object.keys(obj).sort((a, b) => {
    return a.localeCompare(b);
  });
  return Object.fromEntries(
    keys.map((key) => {
      return [key, obj[key]];
    })
  );
}

async function updatePackageJson(packageDir, updateFn) {
  const pathToPkg = path.resolve(packageDir, 'package.json');
  const pkgJson = require(pathToPkg);
  const updated = await updateFn(pkgJson, skip);

  if (updated === skip) {
    return;
  }

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

module.exports = { skip, updatePackageJson, insertAfter, sortKeys };
