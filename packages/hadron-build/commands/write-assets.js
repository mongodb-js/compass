// eslint-disable-next-line strict
'use strict';
const path = require('path');
const fs = require('fs');
const Target = require('../lib/target');

const cli = require('mongodb-js-cli')('hadron-build:download');

const command = 'write-assets [options]';

const describe = 'Write development build assets to console or a file';

const builder = {
  dir: {
    description: 'Project root directory',
    default: process.cwd(),
  },
  'download-url': {
    description: 'Base download url of the asset',
  },
  'build-id': {
    description: 'Build ID',
    default: (process.env.DEV_VERSION_IDENTIFIER ?? '').replaceAll('_', ''),
  },
  out: {
    description: 'Output file path',
    default: undefined,
  },
};

const handler = function handler(argv) {
  cli.argv = argv;
  const version = new Target(argv.dir).version;

  const assets = Target.getAssetsForVersion(argv.dir, version);
  const mappedAssets = {
    id: argv.buildId,
    tag_name: `v${version}`,
    name: version,
    draft: true,
    created_at: new Date(),
    assets: assets.flatMap(({ assets: items }) => items.map(x => ({
      url: `${argv.downloadUrl}/${x.name}`,
      name: x.name,
      id: x.name,
      label: x.name,
    }))),
    body: 'This is a development release and all the changes can be found on https://github.com/mongodb-js/compass'
  };

  if (argv.out) {
    const out = path.resolve(process.cwd(), argv.out);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(mappedAssets, null, 2));
  } else {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(mappedAssets, null, 2));
  }
};

module.exports = {
  command,
  describe,
  builder,
  handler,
};
