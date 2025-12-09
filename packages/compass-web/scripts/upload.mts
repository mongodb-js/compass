import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { brotliCompressSync } from 'zlib';
import { promisify } from 'util';
import S3 from 'aws-sdk/clients/s3.js';

// TODO(SRE-4971): replace with a compass-web-only bucket when provisioned
const DOWNLOADS_BUCKET = 'cdn-origin-compass';

const DIST_DIR = path.resolve(import.meta.dirname, '..', 'dist');

const HEAD = child_process
  .spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' })
  .stdout.trim();

function getCredentials() {
  if (
    !process.env.DOWNLOAD_CENTER_NEW_AWS_ACCESS_KEY_ID ||
    !process.env.DOWNLOAD_CENTER_NEW_AWS_SECRET_ACCESS_KEY ||
    !process.env.DOWNLOAD_CENTER_NEW_AWS_SESSION_TOKEN
  ) {
    throw new Error('Missing required env variables');
  }
  return {
    accessKeyId: process.env.DOWNLOAD_CENTER_NEW_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.DOWNLOAD_CENTER_NEW_AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.DOWNLOAD_CENTER_NEW_AWS_SESSION_TOKEN,
  };
}

const artifacts = await fs.promises.readdir(DIST_DIR);

if (!artifacts.length) {
  throw new Error('No artifact files found');
}

const contentTypeForExt: Record<string, string> = {
  '.mjs': 'text/javascript',
  '.txt': 'text/plain', // extracted third party license info
  '.ts': 'text/typescript', // type definitions
  '.json': 'application/json', // tsdoc meta
};

const ALLOWED_EXTS = Object.keys(contentTypeForExt);

for (const file of artifacts) {
  if (!ALLOWED_EXTS.includes(path.extname(file))) {
    throw new Error(`Unexpected artifact file extension for ${file}`);
  }
}

const s3Client = new S3({
  credentials: getCredentials(),
});

const IMMUTABLE_CACHE_MAX_AGE = 1000 * 60 * 60 * 24 * 7; // a week

for (const file of artifacts) {
  const filePath = path.join(DIST_DIR, file);
  // TODO(SRE-4971): while we're uploading to the downloads bucket, the object
  // key always needs to start with `compass/`
  const objectKey = `compass/web/${HEAD}/${file}`;

  console.log(
    'Uploading compass-web/dist/%s to s3://%s/%s ...',
    file,
    DOWNLOADS_BUCKET,
    objectKey
  );

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const compressedFileContent = brotliCompressSync(fileContent);

  const asyncPutObject: (
    params: S3.Types.PutObjectRequest
  ) => Promise<S3.Types.PutObjectOutput> = promisify(
    s3Client.putObject.bind(s3Client)
  );

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
