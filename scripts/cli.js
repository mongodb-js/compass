#! /usr/bin/env node
// const command = process.argv.slice(2).find((arg) => !arg.startsWith('-'));
// require(`./${command}`);

const fs = require('fs');
const path = require('path');
const { insertAfter } = require('@mongodb-js/monorepo-tools');

const root = path.resolve(__dirname, '..');

fs.readdirSync(path.join(root, 'packages'))
  .map((n) => path.join(root, 'packages', n))
  .map((l) => {
    if (
      l.endsWith('packages/bson-transpilers') ||
      l.endsWith('packages/collection-model') ||
      l.endsWith('packages/database-model') ||
      l.endsWith('packages/instance-model') ||
      l.endsWith('packages/compass') ||
      l.endsWith('packages/hadron-app') ||
      l.endsWith('packages/hadron-build') ||
      l.endsWith('packages/hadron-plugin-manager') ||
      l.endsWith('packages/hadron-type-checker') ||
      l.endsWith('packages/notary-service-client') ||
      l.endsWith('packages/redux-common') ||
      l.endsWith('packages/reflux-store') ||
      l.endsWith('packages/compass-e2e-tests')
    ) {
      return;
    }

    const pkgPath = path.join(l, 'package.json');
    let pkg = require(pkgPath);
    const tsconfPath = path.join(l, 'tsconfig.json');
    let tsconf = (() => {
      try {
        return require(tsconfPath);
      } catch {
        return null;
      }
    })();
    const hasWebpack = fs.existsSync(path.join(l, 'webpack.config.js'));

    if (hasWebpack && tsconf) {
      tsconf.extends = '@mongodb-js/tsconfig-compass/tsconfig.plugin.json';
      fs.writeFileSync(tsconfPath, JSON.stringify(tsconf, null, 2) + '\n');
    }

    // if (pkg.productName && tsconf) {
    //   tsconf.extends = '@mongodb-js/tsconfig-compass/tsconfig.react.json';
    //   fs.writeFileSync(tsconfPath, JSON.stringify(tsconf, null, 2) + '\n');
    // }

    try {
      // const singleExport =
      //   Object.keys(pkg['compass:exports']).length === 1 &&
      //   !!pkg['compass:exports']['.'];
      // if (singleExport && tsconf) {
      //   if (!pkg.exports) {
      //     pkg = insertAfter(pkg, 'compass:main', 'exports', {
      //       compass: pkg['compass:exports']['.'],
      //       require: `./${pkg.main}`,
      //     });
      //     fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
      //     return;
      //   }
      //   pkg.exports = {
      //     compass: pkg['compass:exports']['.'],
      //     ...pkg.exports,
      //   };
      //   fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
      // }
    } catch (err) {
      err.message = `Failed on package ${pkg.name}: ${err.message}`;
      throw err;
    }
  });
