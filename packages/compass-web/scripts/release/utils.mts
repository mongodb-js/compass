import type {
  PutObjectCommandInput,
  PutObjectCommandOutput,
} from '@aws-sdk/client-s3';
import child_process from 'child_process';
import path from 'path';

// TODO(SRE-4971): replace with a compass-web-only bucket when provisioned
export const DOWNLOADS_BUCKET = 'cdn-origin-compass';

export const DOWNLOADS_BUCKET_PUBLIC_HOST = 'https://downloads.mongodb.com';

export const ENTRYPOINT_FILENAME = 'compass-web.mjs';

export const MANIFEST_FILENAME = 'assets-manifest.json';

export const DIST_DIR = path.resolve(import.meta.dirname, '..', '..', 'dist');

export const ALLOWED_PUBLISH_ENVIRONMENTS = ['dev', 'qa', 'staging', 'prod'];

export const PUBLISH_ENVIRONMENT = process.env.COMPASS_WEB_PUBLISH_ENVIRONMENT;

export const DRY_RUN = process.env.COMPASS_WEB_PUBLISH_DRY_RUN === 'true';

export const RELEASE_COMMIT =
  process.env.COMPASS_WEB_RELEASE_COMMIT ||
  child_process
    .spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' })
    .stdout.trim();

function getAWSCredentials() {
  if (
    !process.env.DOWNLOAD_CENTER_NEW_AWS_ACCESS_KEY_ID ||
    !process.env.DOWNLOAD_CENTER_NEW_AWS_SECRET_ACCESS_KEY
  ) {
    throw new Error('Missing required env variables');
  }
  return {
    accessKeyId: process.env.DOWNLOAD_CENTER_NEW_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.DOWNLOAD_CENTER_NEW_AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.DOWNLOAD_CENTER_NEW_AWS_SESSION_TOKEN,
  };
}

let s3Client;

export const putObject: (
  params: PutObjectCommandInput
) => Promise<PutObjectCommandOutput> = async (params) => {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  s3Client ??= new S3Client({
    region: 'us-east-1',
    credentials: getAWSCredentials(),
  });
  return s3Client.send(new PutObjectCommand(params));
};

export function getObjectKey(filename: string, release = RELEASE_COMMIT) {
  // TODO(SRE-4971): while we're uploading to the downloads bucket, the object
  // key always needs to start with `compass/`
  return `compass/compass-web/${release}/${filename}`;
}
