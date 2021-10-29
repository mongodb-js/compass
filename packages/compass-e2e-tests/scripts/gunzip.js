#!/usr/bin/env node
'use strict';

const fastGlob = require('fast-glob');
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
  // windows does not expand * automatically
  const filenames = await fastGlob(process.argv.slice(2));

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
