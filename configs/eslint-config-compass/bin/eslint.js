#!/usr/bin/env node
'use strict';
const path = require('path');
const eslintPkgJson = require('eslint/package.json');
const eslintBinPath = path.resolve(
  path.dirname(require.resolve('eslint/package.json')),
  eslintPkgJson.bin.eslint
);
const sharedEslintConfigPath = path.resolve(__dirname, '..');
if (!process.argv.includes('--resolve-plugins-relative-to')) {
  process.argv.push('--resolve-plugins-relative-to', sharedEslintConfigPath);
}
require(eslintBinPath);
