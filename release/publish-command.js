/* eslint-disable no-console */
const path = require('path');
const Listr = require('listr');
const { cli } = require('cli-ux');
const semver = require('semver');
const chalk = require('chalk');
const _ = require('lodash');

async function publishCommand(
  releaseVersion,
  {
    downloadCenter,
    github,
    wait,
    probePlatformDownloadLink
  }
) {
  const oldConfig = await downloadConfig(downloadCenter);
  const platforms = await getPlatformsForNewVersion(oldConfig, releaseVersion);

  await waitForAssets(downloadCenter, wait, probePlatformDownloadLink, platforms);
  await uploadConfigIfNewer(downloadCenter, oldConfig, releaseVersion);
  await waitGithubRelease(github, wait, releaseVersion);
}

async function waitForAssets(downloadCenter, wait, probePlatformDownloadLink, platforms) {
  cli.info('Waiting for assets to be available');
  cli.action.start('');

  await (new Listr(
    platforms.map((platform) => ({
      title: path.basename(platform.download_link),
      task: () => waitForDownloadLink(downloadCenter, wait, probePlatformDownloadLink, platform)
    })), { concurrent: true }
  )).run();

  cli.action.stop();
}

async function waitGithubRelease(github, wait, releaseVersion) {
  const tag = `v${releaseVersion}`;

  // NOTE: github has a rate limit for unauthenticated
  // request of 60 per hour:
  const waitOptions = { delay: 5 /* minutes */ * 60 * 1000 };

  cli.action.start('Waiting for github release to be created');
  const release = await wait(
    () => github.getReleaseByTag(tag),
    waitOptions
  );
  cli.action.stop();

  if (!release.draft) {
    cli.action.start('Waiting for github release to be published');
    cli.action.stop(chalk.dim(`skipped: release ${releaseVersion} is already public.`));
    return;
  }

  cli.info('');
  cli.info(
    chalk.bgYellow(
      chalk.gray(
        chalk.bold(' MANUAL ACTION REQUIRED!: '))
    ),
    'The github release is still in draft.'
  );
  cli.info('Please review and publish the release at the followng link:', release.html_url);
  cli.info('');
  cli.info('You can run', chalk.bold('npm run release changelog'), 'to get the release notes.');
  cli.info('');

  cli.action.start('Waiting for github release to be published');
  if (!release.draft) {
    cli.stop(chalk.dim(`skipped: release ${releaseVersion} is already public.`));
    return;
  }

  await wait(
    () => github.getReleaseByTag(tag).then(({ draft }) => !draft),
    waitOptions
  );

  cli.action.stop();
}

async function uploadConfigIfNewer(downloadCenter, oldConfig, releaseVersion) {
  cli.action.start('Uploading new download center config');
  const oldConfigVersion = getConfigVersionInSameChannel(
    oldConfig,
    releaseVersion
  );

  if (semver.gte(oldConfigVersion, releaseVersion)) {
    cli.action.stop(chalk.dim(`skipped: ${oldConfigVersion} (old) >= ${releaseVersion} (new)`));
    return;
  }

  const newConfig = replaceVersion(oldConfig, releaseVersion);
  await uploadConfig(downloadCenter, newConfig);

  cli.action.stop();
}

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

async function downloadConfig(downloadCenter) {
  return await downloadCenter.downloadConfig('com-download-center/compass.json');
}

async function uploadConfig(downloadCenter, config) {
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

async function waitForDownloadLink(downloadCenter, wait, probePlatformDownloadLink, platform) {
  await wait(
    async() => {
      const { ok, status } = await probePlatformDownloadLink(downloadCenter, platform);

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
  publishCommand,
  replaceVersion,
  getSemverFromVersionId
};
