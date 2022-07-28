/* eslint-disable mocha/no-exports */
const fs = require('fs-extra');
const { DownloadCenter } = require('@mongodb-js/dl-center');

const DOWNLOADS_BUCKET = 'downloads.10gen.com';
const MANIFEST_BUCKET = 'info-mongodb-com';
const MANIFEST_OBJECT_KEY = 'com-download-center/compass.json';

const requireEnvironmentVariables = (keys) => {
  for (let key of keys) {
    if (process.env[key]) return true;
    throw new TypeError(`Please set the environment variable ${key}`);
  }
};

const getDownloadCenter = (bucketConfig) => {
  requireEnvironmentVariables([
    'DOWNLOAD_CENTER_AWS_ACCESS_KEY_ID',
    'DOWNLOAD_CENTER_AWS_SECRET_ACCESS_KEY'
  ]);

  return new DownloadCenter({
    ...bucketConfig,
    accessKeyId: process.env.DOWNLOAD_CENTER_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.DOWNLOAD_CENTER_AWS_SECRET_ACCESS_KEY
  });
};

const getKeyPrefix = (channel) => {
  return channel && channel !== 'stable' ? `compass/${channel}` : 'compass';
};

const uploadAsset = async(channel, asset) => {
  const dlCenter = getDownloadCenter({ bucket: DOWNLOADS_BUCKET });
  const objectKey = `${getKeyPrefix(channel)}/${asset.name}`;
  return dlCenter.uploadAsset(objectKey, fs.createReadStream(asset.path));
};

const downloadManifest = async() => {
  const dlCenter = getDownloadCenter({ bucket: MANIFEST_BUCKET });
  return dlCenter.downloadConfig(MANIFEST_OBJECT_KEY);
};

const uploadManifest = async(manifest) => {
  const dlCenter = getDownloadCenter({ bucket: MANIFEST_BUCKET });
  return dlCenter.uploadConfig(MANIFEST_OBJECT_KEY, manifest);
};

module.exports = {
  uploadAsset,
  downloadManifest,
  uploadManifest,
  getKeyPrefix
};
