/* eslint-disable valid-jsdoc */
import fs from 'fs';
import path from 'path';
import { DownloadCenter } from '@mongodb-js/dl-center';
import download from 'download';
import type { DownloadCenterConfig } from '@mongodb-js/dl-center/dist/download-center-config';

const DOWNLOADS_BUCKET = 'downloads.10gen.com';
const MANIFEST_BUCKET = 'info-mongodb-com';
const MANIFEST_OBJECT_KEY = 'com-download-center/compass.json';

export const requireEnvironmentVariables = (keys: string[]) => {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new TypeError(
      `Please set the environment variable(s) ${keys.join(', ')}`
    );
  }
  return true;
};

const getDownloadCenter = (bucketConfig: { bucket: string }) => {
  requireEnvironmentVariables([
    'DOWNLOAD_CENTER_AWS_ACCESS_KEY_ID',
    'DOWNLOAD_CENTER_AWS_SECRET_ACCESS_KEY',
  ]);

  return new DownloadCenter({
    ...bucketConfig,
    accessKeyId: process.env.DOWNLOAD_CENTER_AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.DOWNLOAD_CENTER_AWS_SECRET_ACCESS_KEY ?? '',
  });
};

export const getKeyPrefix = (channel?: string) => {
  return channel && channel !== 'stable' ? `compass/${channel}` : 'compass';
};

export const uploadAsset = async (
  channel: string,
  asset: { name: string; path: string }
) => {
  const dlCenter = getDownloadCenter({ bucket: DOWNLOADS_BUCKET });
  const objectKey = `${getKeyPrefix(channel)}/${asset.name}`;
  return dlCenter.uploadAsset(objectKey, fs.createReadStream(asset.path));
};

export const downloadManifest = async (key = MANIFEST_OBJECT_KEY) => {
  const dlCenter = getDownloadCenter({ bucket: MANIFEST_BUCKET });
  return dlCenter.downloadConfig(key);
};

export const uploadManifest = async (manifest: DownloadCenterConfig) => {
  const dlCenter = getDownloadCenter({ bucket: MANIFEST_BUCKET });
  return dlCenter.uploadConfig(MANIFEST_OBJECT_KEY, manifest);
};

export const downloadAssetFromEvergreen = ({
  name,
  path: dest,
}: {
  name: string;
  path: string;
}): Promise<void> => {
  return new Promise((resolve, reject) => {
    requireEnvironmentVariables([
      'EVERGREEN_BUCKET_NAME',
      'EVERGREEN_BUCKET_KEY_PREFIX',
    ]);
    const bucket = process.env.EVERGREEN_BUCKET_NAME;
    const key = `${process.env.EVERGREEN_BUCKET_KEY_PREFIX}/${name}`;
    const url = `https://${bucket}.s3.amazonaws.com/${key}`;
    const stream = download(url);
    fs.promises
      .mkdir(path.dirname(dest), { recursive: true })
      .then(() => {
        stream.pipe(fs.createWriteStream(dest));
        stream.on('end', resolve);
        stream.on('error', reject);
      })
      .catch(reject);
  });
};
