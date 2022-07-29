/* eslint-disable valid-jsdoc */
const fs = require('fs');
const { DownloadCenter } = require('@mongodb-js/dl-center');

const DOWNLOADS_BUCKET = 'downloads.10gen.com';
const MANIFEST_BUCKET = 'info-mongodb-com';
const MANIFEST_OBJECT_KEY = 'com-download-center/compass.json';

const requireEnvironmentVariables = (keys) => {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new TypeError(
      `Please set the environment variable(s) ${keys.join(', ')}`
    );
  }
  return true;
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

const downloadManifest = async(key = MANIFEST_OBJECT_KEY) => {
  const dlCenter = getDownloadCenter({ bucket: MANIFEST_BUCKET });
  return dlCenter.downloadConfig(key);
};

const uploadManifest = async(manifest) => {
  const dlCenter = getDownloadCenter({ bucket: MANIFEST_BUCKET });
  return dlCenter.uploadConfig(MANIFEST_OBJECT_KEY, manifest);
};

module.exports = {
  requireEnvironmentVariables,
  getDownloadCenter,
  getKeyPrefix,
  uploadAsset,
  downloadManifest,
  uploadManifest
};
