/* eslint-disable no-console */
const pkgUp = require('pkg-up');
const _ = require('lodash');
const git = require('./git');
const npm = require('./npm');
const path = require('path');
const Listr = require('listr');
const { cli } = require('cli-ux');
const semver = require('semver');
const chalk = require('chalk');
const github = require('./github');
const downloadCenter = require('./download-center');
const wait = require('./wait');

const { isMainBranch, isReleaseBranch, buildReleaseBranchName } = require('./branches');
const { newBetaVersion, newGaVersion } = require('./bump');

async function getPackageJsonVersion() {
  return require(await pkgUp()).version;
}

async function getValidReleaseBranch() {
  const currentBranch = await git.getCurrentBranch();

  if (!isReleaseBranch(currentBranch)) {
    throw new Error('The current branch is not a release branch.');
  }

  if (await git.isDirty()) {
    throw new Error('You have untracked or staged changes.');
  }

  return currentBranch;
}

async function commitAndPushNewVersion(newSemver, currentBranch) {
  const packageJsonVersion = await getPackageJsonVersion();
  const answer = await cli.confirm(
    `Are you sure you want to bump from ${chalk.bold(packageJsonVersion)} `
    + `to ${chalk.bold(newSemver)} and release?`
  );

  if (!answer) {
    console.info('cancelled.');
    return;
  }

  const newVersionName = `v${newSemver}`;

  cli.action.start(`bumping npm version to ${newVersionName}`);
  await npm.version(newSemver);
  cli.action.stop();

  cli.action.start('staging and tagging changes');
  await git.add('package.json');
  await git.commit(newVersionName);
  await git.tag(newVersionName);
  cli.action.stop();

  cli.action.start(`pushing changes in ${currentBranch}`);
  await git.push(currentBranch);
  cli.action.stop();

  cli.action.start('pushing tags');
  await git.pushTags();
  cli.action.stop();
}

async function releaseBeta() {
  const packageJsonVersion = await getPackageJsonVersion();

  const currentBranch = await getValidReleaseBranch();
  const newSemver = newBetaVersion(packageJsonVersion, currentBranch);
  await commitAndPushNewVersion(
    newSemver,
    currentBranch
  );
}

async function releaseGa() {
  const packageJsonVersion = await getPackageJsonVersion();

  const currentBranch = await getValidReleaseBranch();
  const newSemver = newGaVersion(packageJsonVersion, currentBranch);
  await commitAndPushNewVersion(
    newSemver,
    currentBranch
  );
}

async function checkout(version) {
  if (!isMainBranch(await git.getCurrentBranch())) {
    throw new Error('The current branch is not the main branch.');
  }

  const releaseBranchName = buildReleaseBranchName(version);

  if (!isReleaseBranch(releaseBranchName)) {
    throw new Error('Invalid version');
  }

  await git.checkout(releaseBranchName);
}

function getReleaseChannel(v) {
  return (semver.prerelease(v) || [])[0];
}

async function changelog() {
  await getValidReleaseBranch();
  const releaseVersion = await getPackageJsonVersion();
  const tags = await git.getTags();
  const releaseTag = `v${releaseVersion}`;
  const releaseChannel = getReleaseChannel(releaseTag);

  if (!tags.includes(releaseTag)) {
    throw new Error(`The release tag ${releaseTag} was not found. Is this release tagged?`);
  }

  // finds the first tag that is lower than releaseTag
  const previousTag = tags
    .filter((t) => t.startsWith('v') && semver.valid(t))
    .filter((t) => getReleaseChannel(t) === releaseChannel)
    .sort(semver.compare)
    .reverse()
    .find((t) => semver.lt(t, releaseTag));

  cli.info('');
  cli.info(`Changes from ${chalk.bold(previousTag)}:`);
  const changes = _.uniq(await git.log(previousTag, releaseTag))
    .filter((line) => !semver.valid(line)) // filter out tag commits
    .map((line) => `- ${line}`);

  cli.info(changes.join('\n'));

  cli.info('');
  cli.info('You can see the full list of commits here:');
  const githubCompareUrl = `https://github.com/mongodb-js/compass/compare/${previousTag}...${releaseTag}`
  cli.url(githubCompareUrl, githubCompareUrl);
}

async function publish() {
  await getValidReleaseBranch();

  const releaseVersion = await getPackageJsonVersion();
  if (!await cli.confirm(`Are you sure you want to publish the release ${chalk.bold(releaseVersion)}?`)) {
    return;
  }

  const oldConfig = await downloadCenter.downloadConfig();
  const platforms = await downloadCenter.getPlatformsForNewVersion(oldConfig, releaseVersion);

  await waitForAssets(platforms);
  await uploadConfigIfNewer(oldConfig, releaseVersion);
  await waitGithubRelease(releaseVersion);
}

async function waitForAssets(platforms) {
  cli.info('Waiting for assets to be available');
  cli.action.start('');

  await (new Listr(
    platforms.map((platform) => ({
      title: path.basename(platform.download_link),
      task: () => downloadCenter.waitForDownloadLink(platform)
    })), { concurrent: true }
  )).run();

  cli.action.stop();
}

async function waitGithubRelease(releaseVersion) {
  const tag = `v${releaseVersion}`;

  // NOTE: github has a rate limit for unauthenticated
  // request of 60 per hour:
  const waitOptions =  { delay: 5 /* minutes */ * 60 * 1000 }

  cli.action.start('Waiting for github release to be created');
  const release = await wait(
    () => github.getReleaseByTag(tag),
    waitOptions
  );
  cli.action.stop();

  if (!release.draft) {
    cli.action.start('Waiting for github release to be published');
    cli.stop(chalk.dim(`skipped: release ${releaseVersion} is already public.`));
    return;
  }

  cli.info(chalk.bgYellow('MANUAL ACTION REQUIRED:'), 'The github release is still in draft.');
  cli.info('Please review and publish the release at the followng link:');
  await cli.url(release.html_url, release.html_url);
  cli.info('');
  cli.info('You can run', chalk.bold('npm run release changelog'), 'to get the release notes.');

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

async function uploadConfigIfNewer(oldConfig, releaseVersion) {
  cli.action.start('Uploading new download center config');
  const oldConfigVersion = downloadCenter.getConfigVersionInSameChannel(
    oldConfig,
    releaseVersion
  );

  if (semver.gte(oldConfigVersion, releaseVersion)) {
    cli.action.stop(chalk.dim(`skipped: ${oldConfigVersion} (old) >= ${releaseVersion} (new)`));
    return;
  }

  const newConfig = downloadCenter.replaceVersion(oldConfig, releaseVersion);
  await downloadCenter.uploadConfig(newConfig);

  cli.action.stop();
}

module.exports = {
  releaseBeta,
  releaseGa,
  checkout,
  changelog,
  publish
};


