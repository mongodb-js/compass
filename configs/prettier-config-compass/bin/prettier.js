#!/usr/bin/env node
'use strict';
const path = require('path');
if (process.argv.some((arg) => /^--(no-)?config/.test(arg))) {
  throw new Error('--config option is not allowed');
}
process.argv.push('--config', path.resolve(__dirname, '..', 'index.js'));
require('prettier/bin-prettier.js');
