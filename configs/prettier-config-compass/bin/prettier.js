#!/usr/bin/env node
'use strict';
const path = require('path');
const fs = require('fs');
if (process.argv.some((arg) => /^--(no-)?config/.test(arg))) {
  throw new Error('--config option is not allowed');
}
process.argv.push('--config', path.resolve(__dirname, '..', 'index.js'));
if (!fs.existsSync(path.resolve(process.cwd(), '.prettierignore'))) {
  process.argv.push(
    '--ignore-path',
    path.resolve(__dirname, '..', '.prettierignore-default')
  );
}
require('prettier/bin-prettier.js');
