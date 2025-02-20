'use strict';
const spawn = require('cross-spawn');
const path = require('path');

const modulesToRebuild =
  require('../package.json').config.hadron.rebuild.onlyModules;

// We only want to force rebuild on linux to make sure that the version of glibc
// is matching the platform we're running this on instead of the platform the
// prebuilt was generated on, for other platforms it's okay to just download the
// prebuilt modules when available
const forceRebuildFromSource = process.platform === 'linux';

/** @type {[string, string[]]} */
const rebuildArgs = [
  'electron-rebuild',
  [
    '--only',
    modulesToRebuild.join(','),
    ...(forceRebuildFromSource
      ? [
          // electron-rebuild doesn't allow to force rebuild from source, but we
          // can force it by passing a fake tag that would not allow prebuilt to
          // download the asset
          '--prebuild-tag-prefix',
          'not-real-prefix-to-force-rebuild',
        ]
      : []),
    ...process.argv.slice(2),
  ],
];

// eslint-disable-next-line no-console
console.log('> %s', rebuildArgs.flat().join(' '));

spawn(...rebuildArgs, {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
  env: process.env,
});
