/* eslint-disable no-console */
const pkgUp = require('pkg-up');
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
  await git.add('download-center.json');
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

  // finds the first tag that is lower than releaseTag
  const previousTag = tags
    .filter((t) => t.startsWith('v') && semver.valid(t))
    .filter((t) => getReleaseChannel(t) === releaseChannel)
    .sort(semver.compare)
    .reverse()
    .find((t) => semver.lt(t, releaseTag));

  cli.info((await git.log(previousTag, releaseVersion)).join('\n'));
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

  cli.action.start('Waiting for github release to be created');
  const release = await wait(() => github.getReleaseByTag(tag));
  cli.action.stop();

  if (!release.draft) {
    cli.action.start('Waiting for github release to be published');
    cli.stop(chalk.dim(`skipped: release ${releaseVersion} is already public.`));
    return;
  }

  cli.info('Please review and publish the release at the followng link:');
  await cli.url(release.html_url, release.html_url);

  cli.action.start('Waiting for github release to be published');
  if (!release.draft) {
    cli.stop(chalk.dim(`skipped: release ${releaseVersion} is already public.`));
    return;
  }

  await wait(() => github.getReleaseByTag(tag).then(({ draft }) => !draft));
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


