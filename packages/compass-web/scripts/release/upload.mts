import fs from 'fs';
import path from 'path';
import { brotliCompressSync } from 'zlib';
import {
  DIST_DIR,
  DOWNLOADS_BUCKET,
  asyncPutObject,
  getObjectKey,
} from './utils.mts';

const artifacts = await fs.promises.readdir(DIST_DIR);

if (!artifacts.length) {
  throw new Error('No artifact files found');
}

const contentTypeForExt: Record<string, string> = {
  '.mjs': 'text/javascript',
  '.txt': 'text/plain', // extracted third party license info
  '.ts': 'text/typescript', // type definitions
  '.json': 'application/json', // tsdoc / assets meta
};

const ALLOWED_EXTS = Object.keys(contentTypeForExt);

for (const file of artifacts) {
  if (!ALLOWED_EXTS.includes(path.extname(file))) {
    throw new Error(`Unexpected artifact file extension for ${file}`);
  }
}

const IMMUTABLE_CACHE_MAX_AGE = 1000 * 60 * 60 * 24 * 7; // a week

for (const file of artifacts) {
  const filePath = path.join(DIST_DIR, file);
  const objectKey = getObjectKey(file);

  console.log(
    'Uploading compass-web/dist/%s to s3://%s/%s ...',
    file,
    DOWNLOADS_BUCKET,
    objectKey
  );

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const compressedFileContent = brotliCompressSync(fileContent);

  const res = await asyncPutObject({
    ACL: 'private',
    Bucket: DOWNLOADS_BUCKET,
    Key: objectKey,
    Body: compressedFileContent,
    ContentType: contentTypeForExt[path.extname(file)],
    ContentEncoding: 'br',
    ContentLength: compressedFileContent.byteLength,
    // Assets stored under the commit hash never change after upload, so the
    // cache-control setting for them can be quite generous
    CacheControl: `public, max-age=${IMMUTABLE_CACHE_MAX_AGE}, immutable`,
  });

  console.log('Successfully uploaded %s (ETag: %s)', file, res.ETag);
}
