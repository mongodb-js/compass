import Debug from 'debug';
import { glob as globAsync } from 'glob';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createGunzip } from 'zlib';

const debug = Debug('compass-e2e-tests:gunzip');

async function gunzip(input: string, output: string, signal: AbortSignal) {
  const readStream = createReadStream(input);
  const gunzip = createGunzip();
  const writeStream = createWriteStream(output);
  try {
    await pipeline(readStream, gunzip, writeStream, { signal, end: true });
  } catch (err) {
    if (signal.aborted) {
      return;
    }
    throw err;
  }
}

async function run(glob: string, signal: AbortSignal) {
  const filenames = await globAsync(glob);
  for (const input of filenames) {
    if (signal.aborted) {
      return;
    }
    const output = input.replace(/\.gz$/, '');
    debug(input, '=>', output);
    await gunzip(input, output, signal);
  }
}

export default run;
