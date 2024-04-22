#! /usr/bin/env node
'use strict';
const command = process.argv.slice(2).find((arg) => !arg.startsWith('-'));
require(`./${command}`);
