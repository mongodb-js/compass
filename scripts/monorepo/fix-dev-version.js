const fsExtra = require('fs-extra');
const packageJsonPath = 'packages/compass/package.json';
const packageJson = fsExtra.readJSONSync();
packageJson.version = '0.0.0-dev.0';
fsExtra.writeJSONSync(packageJsonPath, packageJson, {spaces: 2});
