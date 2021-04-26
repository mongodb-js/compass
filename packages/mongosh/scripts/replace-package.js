// Replace a package with symlinks to a specific directory.
// Example:
// REPLACE_PACKAGE=mongodb:/home/src/node-mongodb-native node scripts/replace-package.js
// will make 'mongodb' point to '/home/src/node-mongodb-native' in the root
// directory and all lerna packages.
'use strict';
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const replacement = process.env.REPLACE_PACKAGE;
if (!replacement) {
  throw new Error('REPLACE_PACKAGE missing from environment');
}
const parsed = replacement.trim().match(/^(?<from>[^:]+):(?<to>.+)$/);
if (!parsed || !parsed.groups.from || !parsed.groups.to) {
  throw new Error('Invalid format for REPLACE_PACKAGE');
}

const { from, to } = parsed.groups;
for (const dir of ['.', ...fs.readdirSync('packages').map(dir => path.join('packages', dir))]) {
  const packageJson = path.join(dir, 'package.json');
  if (fs.existsSync(packageJson)) {
    const target = pathToFileURL(path.resolve(to)).href;
    const contents = JSON.parse(fs.readFileSync(packageJson));
    for (const deps of [
      contents.dependencies,
      contents.devDependencies,
      contents.optionalDependencies
    ]) {
      if (deps && deps[from]) {
        console.info('Replacing', from, 'in', dir, 'with', target);
        deps[from] = to;
      }
    }
    fs.writeFileSync(packageJson, JSON.stringify(contents, null, '  ') + '\n');
  }
}
