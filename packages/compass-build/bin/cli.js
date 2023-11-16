#!/usr/bin/env node
const path = require('path');

try {
  require.resolve('../dist/cli.js');
  require('../dist/cli.js');
} catch {
  // if the compiled version is not available fallback to ts-node
  require('ts-node').register({
    project: path.resolve(__dirname, '..', 'tsconfig.json'),
  });

  require('../src/cli');
}
