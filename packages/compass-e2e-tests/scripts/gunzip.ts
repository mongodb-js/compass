#!/usr/bin/env ts-node

import fastGlob from 'fast-glob';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { createGunzip } from 'zlib';

const pipe = promisify(pipeline);

async function gunzip(input: string, output: string) {
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
  run().catch((err: Error) => {
    console.error('An error occurred:', err);
    process.exitCode = 1;
  });
}

module.exports = gunzip;
