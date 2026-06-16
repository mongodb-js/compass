import { createReadStream, createWriteStream } from 'fs';
import { promises as fs } from 'fs';
import path from 'path';
import { DownloadCenter } from '@mongodb-js/dl-center';
import download from 'download';

const DOWNLOADS_BUCKET = 'downloads.10gen.com';
const DOWNLOADS_BUCKET_NEW = 'cdn-origin-compass';
const MANIFEST_BUCKET = 'info-mongodb-com';
const MANIFEST_OBJECT_KEY = 'com-download-center/compass.json';

export function requireEnvironmentVariables(keys: string[]): true {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new TypeError(
      `Please set the environment variable(s) ${keys.join(', ')}`
    );
  }
  return true;
}

function getDownloadCenter(
  bucketConfig: Record<string, unknown>
): DownloadCenter {
  requireEnvironmentVariables([
    'DOWNLOAD_CENTER_AWS_ACCESS_KEY_ID',
    'DOWNLOAD_CENTER_AWS_SECRET_ACCESS_KEY',
  ]);

  return new DownloadCenter({
    ...bucketConfig,
    accessKeyId: process.env.DOWNLOAD_CENTER_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.DOWNLOAD_CENTER_AWS_SECRET_ACCESS_KEY,
  } as unknown as ConstructorParameters<typeof DownloadCenter>[0]);
}

function getDownloadCenterNew(
  bucketConfig: Record<string, unknown>
): DownloadCenter {
  requireEnvironmentVariables([
    'DOWNLOAD_CENTER_NEW_AWS_ACCESS_KEY_ID',
    'DOWNLOAD_CENTER_NEW_AWS_SECRET_ACCESS_KEY',
    'DOWNLOAD_CENTER_NEW_AWS_SESSION_TOKEN',
  ]);

  return new DownloadCenter({
    ...bucketConfig,
    accessKeyId: process.env.DOWNLOAD_CENTER_NEW_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.DOWNLOAD_CENTER_NEW_AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.DOWNLOAD_CENTER_NEW_AWS_SESSION_TOKEN,
  } as unknown as ConstructorParameters<typeof DownloadCenter>[0]);
}

export function getKeyPrefix(channel = ''): string {
  return channel && channel !== 'stable' ? `compass/${channel}` : 'compass';
}

export async function uploadAssetNew(
  channel: string,
  asset: { name: string; path: string }
): Promise<void> {
  const dlCenterNew = getDownloadCenterNew({ bucket: DOWNLOADS_BUCKET_NEW });
  const objectKey = `${getKeyPrefix(channel)}/${asset.name}`;
  await dlCenterNew.uploadAsset(objectKey, createReadStream(asset.path), {
    acl: 'private',
  });
}

export async function uploadAsset(
  channel: string,
  asset: { name: string; path: string }
): Promise<void> {
  const dlCenter = getDownloadCenter({ bucket: DOWNLOADS_BUCKET });
  const objectKey = `${getKeyPrefix(channel)}/${asset.name}`;
  await dlCenter.uploadAsset(objectKey, createReadStream(asset.path));
}

export async function downloadManifest(
  key = MANIFEST_OBJECT_KEY
): Promise<unknown> {
  const dlCenter = getDownloadCenter({ bucket: MANIFEST_BUCKET });
  return dlCenter.downloadConfig(key);
}

export async function uploadManifest(manifest: unknown): Promise<void> {
  const dlCenter = getDownloadCenter({ bucket: MANIFEST_BUCKET });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await dlCenter.uploadConfig(MANIFEST_OBJECT_KEY, manifest as any);
}

export function downloadAssetFromEvergreen(asset: {
  name: string;
  path: string;
}): Promise<void> {
  const { name, path: dest } = asset;
  // eslint-disable-next-line no-async-promise-executor, @typescript-eslint/no-misused-promises
  return new Promise(async (resolve, reject) => {
    requireEnvironmentVariables(['EVERGREEN_BUCKET_KEY_PREFIX']);
    const key = `compass-dev/${process.env.EVERGREEN_BUCKET_KEY_PREFIX}/${name}`;
    const url = `https://downloads.mongodb.com/${key}`;
    const stream = download(url);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    stream.pipe(createWriteStream(dest));
    void stream.on('end', resolve);
    void stream.on('error', reject);
  });
}
