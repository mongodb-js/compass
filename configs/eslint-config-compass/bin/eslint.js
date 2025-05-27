#!/usr/bin/env node
'use strict';
const path = require('path');
const eslintPkgJson = require('eslint/package.json');
const eslintBinPath = path.resolve(
  path.dirname(require.resolve('eslint/package.json')),
  eslintPkgJson.bin.eslint
);
require(eslintBinPath);
