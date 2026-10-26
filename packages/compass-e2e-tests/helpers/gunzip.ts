import Debug from 'debug';
import { glob as globAsync } from 'glob';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import path from 'node:path';

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

async function run(glob: string, cwd: string, signal: AbortSignal) {
  const filenames = (await globAsync(glob, { cwd })).map((filepath) => {
    return path.join(cwd, filepath);
  });
  if (filenames.length === 0) {
    throw new Error(`Failed to unpack ${glob} at ${cwd}: no files found`);
  }
  debug('Unpacking following files:', filenames);
  for (const input of filenames) {
    if (signal.aborted) {
      return;
    }
    const output = input.replace(/\.gz$/, '');
    await gunzip(input, output, signal);
  }
}

export default run;
