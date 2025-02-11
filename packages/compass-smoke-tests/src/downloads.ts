import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import stream from 'node:stream';
import createDebug from 'debug';

const debug = createDebug('compass:smoketests:downloads');

import { ensureDownloadsDirectory } from './directories';

type DownloadFileOptions = {
  url: string;
  targetFilename: string;
  clearCache?: boolean;
};

export async function downloadFile({
  url,
  targetFilename,
  clearCache,
}: DownloadFileOptions): Promise<string> {
  const response = await fetch(url);

  assert(
    response.ok,
    `Request failed with status ${response.status} (${response.statusText})`
  );
  const etag = response.headers.get('etag');
  assert(etag, 'Expected an ETag header');
  const cleanEtag = etag.match(/[0-9a-fA-F]/g)?.join('');
  assert(cleanEtag, 'Expected ETag to be cleanable');
  const cacheDirectoryPath = path.resolve(
    ensureDownloadsDirectory(),
    cleanEtag
  );
  const outputPath = path.resolve(cacheDirectoryPath, targetFilename);
  const cacheExists = fs.existsSync(outputPath);

  if (cacheExists) {
    if (clearCache) {
      fs.rmSync(cacheDirectoryPath, { recursive: true, force: true });
    } else {
      debug('Skipped downloading', url, '(cache existed)');
      return outputPath;
    }
  }

  if (!fs.existsSync(cacheDirectoryPath)) {
    fs.mkdirSync(cacheDirectoryPath);
  }

  // Write the response to file
  assert(response.body, 'Expected a response body');
  debug('Downloading', url);
  await stream.promises.pipeline(
    response.body,
    fs.createWriteStream(outputPath)
  );

  return outputPath;
}
