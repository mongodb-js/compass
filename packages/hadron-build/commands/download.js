// eslint-disable-next-line strict
'use strict';
const path = require('path');
const Target = require('../lib/target');
const { downloadAssetFromEvergreen } = require('../lib/download-center');

const cli = require('mongodb-js-cli')('hadron-build:download');
const abortIfError = cli.abortIfError.bind(cli);
const root = path.resolve(__dirname, '..', '..', '..');

const command = 'download [options]';

const describe = 'Download all `release` assets from evergreen bucket';

const builder = {
  dir: {
    description: 'Project root directory',
    default: process.cwd()
  },
  version: {
    description: 'Target version',
    default: require(path.join(process.cwd(), 'package.json')).version
  }
};

const handler = function handler(argv) {
  cli.argv = argv;
  argv.version = argv.version.replace(/^v/, '');

  const assets = Target.getAssetsForVersion(argv.dir, argv.version);

  // eslint-disable-next-line no-shadow
  const assetsToDownload = assets.flatMap(({ assets }) => {
    return assets;
  });

  const downloads = assetsToDownload.map(async(asset) => {
    const shortPath = path.relative(root, asset.path);
    cli.info(
      `${asset.name}: download from evg bucket started (path: ${shortPath})`
    );
    await downloadAssetFromEvergreen(asset);
    cli.info(`${asset.name}: download from evg bucket complete`);
  });

  Promise.all(downloads).catch(abortIfError);
};

module.exports = {
  command,
  describe,
  builder,
  handler
};
