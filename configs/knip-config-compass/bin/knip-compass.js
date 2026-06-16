#!/usr/bin/env node
'use strict';
// Inject --no-config-hints unless already present
if (!process.argv.includes('--no-config-hints')) {
  process.argv.splice(2, 0, '--no-config-hints');
}
const path = require('path');
const { execFileSync } = require('child_process');
// Locate knip's bin: require.resolve('knip') → .../knip/dist/index.js
const knipBin = path.join(
  path.dirname(require.resolve('knip')),
  '..',
  'bin',
  'knip.js'
);
try {
  execFileSync(process.execPath, [knipBin, ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: process.env,
  });
} catch (err) {
  process.exit(err.status ?? 1);
}
