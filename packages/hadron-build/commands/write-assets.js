// eslint-disable-next-line strict
'use strict';
const path = require('path');
const fs = require('fs');
const Target = require('../lib/target');
const { generateVersionsForAssets } = require('../lib/assets');

const cli = require('mongodb-js-cli')('hadron-build:download');

const command = 'write-assets [options]';

const describe = 'Write the build assets to console or a file';

const builder = {
  dir: {
    description: 'Project root directory',
    default: process.cwd(),
  },
  url: {
    description: 'Base download url of the asset',
  },
  version: {
    description: 'Target version',
    default: undefined,
  },
  out: {
    description: 'Output file path',
    default: undefined,
  },
};

const handler = function handler(argv) {
  cli.argv = argv;
  const version = (
    argv.version ? argv.version : new Target(argv.dir).version
  ).replace(/^v/, '');

  const assets = generateVersionsForAssets(
    Target.getAssetsForVersion(argv.dir, version),
    version,
    argv.url
  );
  if (argv.out) {
    const out = path.resolve(process.cwd(), argv.out);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(assets, null, 2));
  } else {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(assets, null, 2));
  }
};

module.exports = {
  command,
  describe,
  builder,
  handler,
};
