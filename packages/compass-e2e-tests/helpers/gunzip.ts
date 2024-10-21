import Debug from 'debug';
import fastGlob from 'fast-glob';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { createGunzip } from 'zlib';

const debug = Debug('compass-e2e-tests:gunzip');

const pipe = promisify(pipeline);

async function gunzip(input: string, output: string) {
  const readStream = createReadStream(input);
  const gunzip = createGunzip();
  const writeStream = createWriteStream(output);

  await pipe(readStream, gunzip, writeStream);
}

async function run(glob: string) {
  const filenames = await fastGlob(glob);
  for (const input of filenames) {
    const output = input.replace(/\.gz$/, '');
    debug(input, '=>', output);
    await gunzip(input, output);
  }
}

export default run;
