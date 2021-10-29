#!/usr/bin/env node
'use strict';

const { createReadStream, createWriteStream } = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');
const { createGunzip } = require('zlib');

const pipe = promisify(pipeline);

async function gunzip(input, output) {
  const readStream = createReadStream(input);
  const gunzip = createGunzip();
  const writeStream = createWriteStream(output);

  await pipe(readStream, gunzip, writeStream);
}

async function run() {
  const filenames = process.argv.slice(2);
  for (const input of filenames) {
    const output = input.replace(/\.gz$/, '');
    console.log(input, '=>', output);
    await gunzip(input, output);
  }
}

if (require.main === module) {
  run().catch((err) => {
    console.error('An error occurred:', err);
    process.exitCode = 1;
  });
}

module.exports = gunzip;
