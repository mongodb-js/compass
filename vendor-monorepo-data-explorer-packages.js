const mmsDeps = require('../mms/package.json').dependencies;

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const workspaces = new Map(
  [
    ...fs
      .readdirSync('packages')
      .map((name) => path.join(__dirname, 'packages', name)),
    ...fs
      .readdirSync('configs')
      .map((name) => path.join(__dirname, 'configs', name))
  ].map((fullPath) => {
    const pkgJson = require(path.join(fullPath, 'package.json'));
    return [pkgJson.name, { ...pkgJson, __path: fullPath }];
  })
);

const directMmsMonorepoDeps = new Set();

for (const [name] of Object.entries(mmsDeps)) {
  if (workspaces.has(name)) {
    directMmsMonorepoDeps.add(name);
  }
}

const allMmsMonorepoDeps = new Set(directMmsMonorepoDeps.values());

for (const directDepName of allMmsMonorepoDeps.values()) {
  const pkgJson = workspaces.get(directDepName);
  const allPkgDepNames = new Set([
    ...Object.keys(pkgJson.dependencies ?? {}),
    ...Object.keys(pkgJson.peerDependencies ?? {}),
    ...Object.keys(pkgJson.devDependencies ?? {})
  ]);
  for (const depName of allPkgDepNames.values()) {
    if (workspaces.has(depName)) {
      allMmsMonorepoDeps.add(depName);
    }
  }
}

console.log('Found %s monorepo packages used in mms', allMmsMonorepoDeps.size);

const extraneousWorkspaces = new Set(
  Array.from(workspaces.keys()).filter((key) => {
    return !allMmsMonorepoDeps.has(key);
  })
);

console.log();
console.log(
  'There are %s extraneous packages not used by mms in the monorepo',
  extraneousWorkspaces.size
);

const packageLock = require('./package-lock.json');

function matches(key, path) {
  return key === path || key.startsWith(path + '/');
}

for (const pkgName of extraneousWorkspaces.values()) {
  console.log('  Removing %s', pkgName);
  const { __path } = workspaces.get(pkgName);
  const relativePath = path.relative(process.cwd(), __path);
  const nodeModulesPath = `node_modules/${pkgName}`;
  delete packageLock.dependencies[pkgName];
  for (const key of Object.keys(packageLock.packages)) {
    if (matches(key, relativePath) || matches(key, nodeModulesPath)) {
      delete packageLock.packages[key];
    }
  }
  fs.rmSync(__path, { recursive: true, force: true });
}

// Weird special case for hadron-plugin-manager dep
delete packageLock.packages['node_modules/@external-plugins/example3'];
delete packageLock.dependencies['@external-plugins/example3'];

fs.writeFileSync('./package-lock.json', JSON.stringify(packageLock, null, 2));

console.log();
console.log('Moving packages to @cloud-mongodb-js namespace');

const allFiles = glob
  .sync('**/*.{js,jsx,ts,tsx,json,md}', {
    ignore: ['**/node_modules/**', 'check-deps.js']
  })
  .map((relativePath) => {
    return path.resolve(relativePath);
  });

for (const filePath of allFiles) {
  console.log(
    '  Renaming packages in %s',
    path.relative(process.cwd(), filePath)
  );

  fs.writeFileSync(
    filePath,
    Array.from(allMmsMonorepoDeps.values()).reduce((fileContents, pkgName) => {
      return fileContents.replaceAll(
        new RegExp(`(?<!(@cloud-mongodb-js|packages)\/)${pkgName}`, 'g'),
        '@cloud-mongodb-js/' + pkgName.replace(/^@.+?\//, '')
      );
    }, fs.readFileSync(filePath, 'utf8'))
  );
}
