const fs = require('fs');
const path = require('path');

const packageLock = require('../../package-lock.json');
const packageJson = require('../../package.json');
const minimatch = require('minimatch');
const workspaces = packageJson.workspaces;

const matchingWorkspacePath = Object.keys(packageLock.packages).filter(
  (name) => {
    return workspaces.some((pattern) => minimatch(name, pattern));
  }
);

const stalePackages = matchingWorkspacePath.filter((p) => {
  const fullPath = path.resolve(__dirname, '..', '..', p);
  return !fs.existsSync(fullPath);
});

if (stalePackages.length) {
  console.log('stalePackages detected:', stalePackages);

  const packageLockClone = JSON.parse(JSON.stringify(packageLock));

  for (const stale of stalePackages) {
    delete packageLockClone.packages[stale];
  }

  console.log('stale packages will be deleted from package-lock');

  fs.writeFileSync(
    path.resolve(__dirname, '..', '..', 'package-lock.json'),
    JSON.stringify(packageLockClone, null, 2)
  );
}
