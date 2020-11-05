const { DownloadCenter, probePlatformDownloadLink } = require('@mongodb-js/dl-center');
const _ = require('lodash');

const {
  getReleaseChannel,
  extractFromString
} = require('./version');
const wait = require('./wait');

const BUCKET_NAME = 'info-mongodb-com';
const CONFIG_OBJECT_KEY = 'com-download-center/compass.json';

class CompassDownloadCenter {
  constructor(bucketConfig) {
    this.mongodbDownloadCenter = new DownloadCenter({
      ...bucketConfig,
      bucket: BUCKET_NAME
    });
  }

  async downloadConfig() {
    return await this.mongodbDownloadCenter.downloadConfig(CONFIG_OBJECT_KEY);
  }

  async uploadConfig(config) {
    return await this.mongodbDownloadCenter.uploadConfig(
      CONFIG_OBJECT_KEY,
      config
    );
  }

  getAssets(config, releaseChannel) {
    if (!releaseChannel) {
      throw new Error('releaseChannel is required');
    }

    return config.versions
      .filter(
        (versionDocument) => getReleaseChannel(versionDocument._id) === releaseChannel
      )
      .map(versionDocument => versionDocument.platform)
      .reduce((flattened, nested) => [...flattened, ...nested], []); // flatten
  }

  async waitForAsset(platformAsset) {
    await wait(
      async() => {
        const { ok, status } = await probePlatformDownloadLink(platformAsset);

        if (ok) {
          return true;
        }

        if (status !== 403 && status !== 404) {
          throw new Error(`unexpected response: ${platformAsset.download_link}: ${status}`);
        }
      },
      {
        delay: 5000,
        maxWaitTime: 6 * /* hours */ (1000 * 60 * 60)
      }
    );
  }

  getVersion(config, releaseChannel) {
    if (!releaseChannel) {
      throw new Error('releaseChannel is required');
    }

    const oldVersion = config.versions
      .filter(
        (versionDocument) => getReleaseChannel(versionDocument._id) === releaseChannel
      ).map(
        (versionDocument) => extractFromString(versionDocument._id)
      )[0];

    return oldVersion;
  }

  replaceVersion(oldConfig, newVersion) {
    const newConfig = {
      ...oldConfig,
      versions: oldConfig.versions.map(
        (versionDoc) => updateVersionDocument(versionDoc, newVersion))
    };

    return newConfig;
  }
}

function updateVersionDocument(originalVersionDoc, releaseVersion) {
  const originalVersion = extractFromString(originalVersionDoc._id);

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

module.exports = CompassDownloadCenter;
