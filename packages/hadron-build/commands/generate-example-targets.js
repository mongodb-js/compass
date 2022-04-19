const fs = require('fs');

const Target = require('../lib/target');
const path = require('path');
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function replaceAll(str, match, replacement) {
  return str.replace(new RegExp(escapeRegExp(match), 'g'), ()=>replacement);
}

function getTargetConfig({ channel, platform, arch = process.arch }) {
  const compassPackagePath = path.resolve(__dirname, '../../../packages/compass');

  const version = channel === 'stable' ? '1.2.3' : `1.2.3-${channel}.0`;
  const target = new Target(
    compassPackagePath,
    { version, platform, arch }
  );

  const config = {...target, pkg: undefined};

  let fileContent = JSON.stringify(config, null, 2);
  fileContent = replaceAll(fileContent, compassPackagePath, '<%= compassPackagePath %>');
  return fileContent;
}

function generateExampleTargets() {
  const channels = ['stable', 'beta', 'dev'];
  const platforms = ['linux', 'darwin', 'win32'];
  const editions = [{
    HADRON_DISTRIBUTION: 'compass',
    HADRON_PRODUCT: 'mongodb-compass',
    HADRON_PRODUCT_NAME: 'MongoDB Compass',
  }, {
    HADRON_DISTRIBUTION: 'compass-readonly',
    HADRON_PRODUCT: 'mongodb-compass-readonly',
    HADRON_PRODUCT_NAME: 'MongoDB Compass Readonly',
    HADRON_READONLY: 'true'
  }, {
    HADRON_DISTRIBUTION: 'compass-isolated',
    HADRON_PRODUCT: 'mongodb-compass-isolated',
    HADRON_PRODUCT_NAME: 'MongoDB Compass Isolated Edition',
    HADRON_ISOLATED: 'true'
  }];
  for (const channel of channels) {
    for (const platform of platforms) {
      for (const edition of editions) {
        for (const [k, v] of Object.entries(edition)) {
          process.env[k] = v;
          // eslint-disable-next-line no-sync
          fs.writeFileSync(path.join(__dirname, '..', 'example-targets', `${edition.HADRON_DISTRIBUTION}-${channel}-${platform}.json`), getTargetConfig({
            channel, platform
          }));
        }
      }
    }
  }
}

generateExampleTargets();
