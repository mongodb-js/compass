const path = require('path');
const { promises: fs } = require('fs');

const ROOT = path.resolve(__dirname, '..', '..');

async function forEachPackage(fn) {
  let interrupted = false;
  const interrupt = () => {
    interrupted = true;
  };
  const packagesDir = path.resolve(ROOT, 'packages');
  const packages = (await fs.readdir(packagesDir)).map((dir) =>
    path.join(packagesDir, dir)
  );
  const result = [];
  for (const packageDir of packages) {
    const packageJson = require(path.join(packageDir, 'package.json'));
    result.push(
      await fn({ rootDir: ROOT, packageDir, packageJson }, interrupt)
    );
    if (interrupted) {
      break;
    }
  }
  return result;
}

module.exports = { forEachPackage };
