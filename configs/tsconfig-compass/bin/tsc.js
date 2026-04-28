#!/usr/bin/env node
'use strict';
const path = require('path');
const { inspect } = require('util');
const typescriptPackageJsonPath = require.resolve('typescript/package.json');
const typescriptPackagePath = path.dirname(typescriptPackageJsonPath);
const { bin } = require(typescriptPackageJsonPath);
if (!bin.tsc) {
  throw new Error(`Can not proxy tsc cli, no path to tsc: ${inspect(bin)}`);
}
require(path.join(typescriptPackagePath, bin.tsc));
