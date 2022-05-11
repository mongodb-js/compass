#! /usr/bin/env node
const command = process.argv.slice(2).find((arg) => !arg.startsWith('-'));
require(`./${command}`);
