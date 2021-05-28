const fsExtra = require('fs-extra');

fixVersion('packages/compass/package.json');
fixVersion('packages/compass/package-lock.json');

function fixVersion(jsonFilePath) {
  if (!fsExtra.existsSync(jsonFilePath)) {
    return;
  }
  const content = fsExtra.readJSONSync(jsonFilePath);
  content.version = '0.0.0-dev.0';
  fsExtra.writeJSONSync(jsonFilePath, content, {spaces: 2});
}
