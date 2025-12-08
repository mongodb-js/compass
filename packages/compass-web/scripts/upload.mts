import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { brotliCompressSync } from 'zlib';
import { S3 } from '@aws-sdk/client-s3';

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
  '.ts': 'text/typescript', // type definitions
  '.txt': 'text/plain', // extracted third party license info
};

const ALLOWED_EXTS = Object.keys(contentTypeForExt);

for (const file of artifacts) {
  if (!ALLOWED_EXTS.includes(path.extname(file))) {
    throw new Error(`Unexpected artifact file extension for ${file}`);
  }
}

const s3Client = new S3({
  region: 'us-east-1',
  useArnRegion: true,
  credentials: getCredentials(),
});

for (const file of artifacts) {
  const filePath = path.join(DIST_DIR, file);
  // NB: important that upload root directory is always `compass/`
  const objectKey = `compass/web/${HEAD}/${file}`;

  console.log(
    'Uploading compass-web/dist/%s to s3://%s/%s ...',
    file,
    DOWNLOADS_BUCKET,
    objectKey
  );

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const compressedFileContent = brotliCompressSync(fileContent);

  const res = await s3Client.putObject({
    ACL: 'private',
    Bucket: DOWNLOADS_BUCKET,
    Key: objectKey,
    Body: compressedFileContent,
    ContentType: contentTypeForExt[path.extname(file)],
    ContentEncoding: 'br',
    ContentLength: compressedFileContent.byteLength,
  });

  console.log('Successfully uploaded %s (ETag: %s)', file, res.ETag);
}
