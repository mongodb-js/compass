import S3 from 'aws-sdk/clients/s3.js';
import child_process from 'child_process';
import path from 'path';
import { promisify } from 'util';

// TODO(SRE-4971): replace with a compass-web-only bucket when provisioned
export const DOWNLOADS_BUCKET = 'cdn-origin-compass';

export const DOWNLOADS_BUCKET_PUBLIC_HOST = 'https://downloads.mongodb.com';

export const ENTRYPOINT_FILENAME = 'compass-web.mjs';

export const MANIFEST_FILENAME = 'assets-manifest.json';

export const DIST_DIR = path.resolve(import.meta.dirname, '..', '..', 'dist');

export const ALLOWED_PUBLISH_ENVIRONMENTS = ['dev', 'qa', 'staging', 'prod'];

export const PUBLISH_ENVIRONMENT = process.env.COMPASS_WEB_PUBLISH_ENVIRONMENT;

export const RELEASE_COMMIT =
  process.env.COMPASS_WEB_RELEASE_COMMIT ||
  child_process
    .spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' })
    .stdout.trim();

function getAWSCredentials() {
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
const s3Client = new S3({
  credentials: getAWSCredentials(),
});

export const asyncPutObject: (
  params: S3.Types.PutObjectRequest
) => Promise<S3.Types.PutObjectOutput> = promisify(
  s3Client.putObject.bind(s3Client)
);

export function getObjectKey(filename: string, release = RELEASE_COMMIT) {
  // TODO(SRE-4971): while we're uploading to the downloads bucket, the object
  // key always needs to start with `compass/`
  return `compass/compass-web/${release}/${filename}`;
}
