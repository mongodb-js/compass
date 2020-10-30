const { DownloadCenter, probePlatformDownloadLink } = require('@mongodb-js/dl-center');
const _ = require('lodash');
const delay = require('delay');
const env = require('./env');
const wait = require('./wait');

function getReleaseChannel(versionString) {
  return versionString.match('beta') ? 'beta' : 'ga';
}

function getSemverFromVersionId(versionId) {
  return versionId.match(/\d+\.\d+\.\d+(-beta\.\d+)?/)[0];
}

function updateVersionDocument(originalVersionDoc, releaseVersion) {
  const originalVersion = getSemverFromVersionId(originalVersionDoc._id);

  // Debian files have a tilde in the file name
  const originalVersionDeb = originalVersion.replace('-beta', '~beta');
  const releaseVersionDeb = releaseVersion.replace('-beta', '~beta');

  const versionDocChannel = getReleaseChannel(originalVersionDoc._id);
  const releaseChannel = getReleaseChannel(releaseVersion);

  if (versionDocChannel !== releaseChannel) {
    return originalVersionDoc;
  }

  const stringifiedDoc = JSON.stringify(originalVersionDoc);
  const replaced = stringifiedDoc
    .replace(
      new RegExp(_.escapeRegExp(originalVersion), 'g'),
      releaseVersion
    )
    .replace(
      new RegExp(_.escapeRegExp(originalVersionDeb), 'g'),
      releaseVersionDeb
    );

  return JSON.parse(replaced);
}

function replaceVersion(original, version) {
  const newConfig = {
    ...original,
    versions: original.versions.map(
      (versionDoc) => updateVersionDocument(versionDoc, version))
  };

  return newConfig;
}

async function downloadConfig() {
  const downloadCenter = new DownloadCenter({
    bucket: 'info-mongodb-com',
    accessKeyId: env.requireEnvVar('MONGODB_DOWNLOADS_AWS_ACCESS_KEY_ID'),
    secretAccessKey: env.requireEnvVar('MONGODB_DOWNLOADS_AWS_SECRET_ACCESS_KEY')
  });

  return await downloadCenter.downloadConfig('com-download-center/compass.json');
}

async function uploadConfig(config) {
  const downloadCenter = new DownloadCenter({
    bucket: 'info-mongodb-com',
    accessKeyId: env.requireEnvVar('MONGODB_DOWNLOADS_AWS_ACCESS_KEY_ID'),
    secretAccessKey: env.requireEnvVar('MONGODB_DOWNLOADS_AWS_SECRET_ACCESS_KEY')
  });

  return await downloadCenter.uploadConfig(
    'com-download-center/compass.json',
    config
  );
}

async function getPlatformsForNewVersion(oldConfig, newReleaseVersion) {
  const releaseChannel = getReleaseChannel(newReleaseVersion);
  const newConfig = replaceVersion(oldConfig, newReleaseVersion);
  return newConfig.versions
    .filter(
      (versionDocument) => getReleaseChannel(versionDocument._id) === releaseChannel
    )
    .map(versionDocument => versionDocument.platform)
    .reduce((flattened, nested) => [...flattened, ...nested], []); // flatten
}

function getConfigVersionInSameChannel(oldConfig, newReleaseVersion) {
  const releaseChannel = getReleaseChannel(newReleaseVersion);

  const oldVersion = oldConfig.versions
    .filter(
      (versionDocument) => getReleaseChannel(versionDocument._id) === releaseChannel
    ).map(
      (versionDocument) => getSemverFromVersionId(versionDocument._id)
    )[0];

  return oldVersion;
}

async function waitForDownloadLink(platform) {
  await wait(
    async() => {
      const { ok, status } = await probePlatformDownloadLink(platform);

      if (ok) {
        return true;
      }

      if (status !== 403 && status !== 404) {
        throw new Error(`unexpected response: ${platform.download_link}: ${status}`);
      }
    },
    {
      delay: 5000,
      maxWaitTime: 6 * /* hours */ (1000 * 60 * 60)
    }
  );
}

module.exports = {
  getPlatformsForNewVersion,
  probePlatformDownloadLink,
  downloadConfig,
  uploadConfig,
  replaceVersion,
  getConfigVersionInSameChannel,
  getSemverFromVersionId,
  waitForDownloadLink
};
