/* eslint-disable no-console */
const pkgUp = require('pkg-up');
const _ = require('lodash');
const { DownloadCenter, probePlatformDownloadLink } = require('@mongodb-js/dl-center');
const git = require('./git');
const npm = require('./npm');
const { cli } = require('cli-ux');
const semver = require('semver');
const chalk = require('chalk');
const { isMainBranch, isReleaseBranch, buildReleaseBranchName } = require('./branches');
const { newBetaVersion, newGaVersion } = require('./bump');
const env = require('./env');
const publishCommand = require('./publish-command');
const github = require('./github');
const wait = require('./wait');

async function getPackageJsonVersion() {
  return require(await pkgUp()).version;
}

async function getValidReleaseBranch() {
  const currentBranch = await git.getCurrentBranch();

  if (!isReleaseBranch(currentBranch)) {
    throw new Error(`The current branch (${currentBranch}) is not a release branch.`);
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

function getPrerelease(v) {
  return (semver.prerelease(v) || [])[0];
}

function isGa(v) {
  return !getPrerelease(v);
}

async function changelog() {
  await getValidReleaseBranch();
  const releaseVersion = await getPackageJsonVersion();
  const tags = await git.getTags();
  const releaseTag = `v${releaseVersion}`;
  const isGaRelease = isGa(releaseTag);

  if (!tags.includes(releaseTag)) {
    throw new Error(`The release tag ${releaseTag} was not found. Is this release tagged?`);
  }

  // finds the first tag that is lower than releaseTag
  const previousTag = tags
    .filter((t) => t.startsWith('v') && semver.valid(t))
    .filter((t) => isGaRelease ? isGa(t) : true) // if is GA only consider other GAs
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
  const githubCompareUrl = `https://github.com/mongodb-js/compass/compare/${previousTag}...${releaseTag}`;
  cli.url(githubCompareUrl, githubCompareUrl);
}

async function publish() {
  await getValidReleaseBranch();

  const releaseVersion = await getPackageJsonVersion();

  const answer = await cli.confirm(`Are you sure you want to publish the release ${chalk.bold(releaseVersion)}?`);
  if (!answer) {
    return;
  }

  const downloadCenter = new DownloadCenter({
    bucket: 'info-mongodb-com',
    accessKeyId: env.requireEnvVar('MONGODB_DOWNLOADS_AWS_ACCESS_KEY_ID'),
    secretAccessKey: env.requireEnvVar('MONGODB_DOWNLOADS_AWS_SECRET_ACCESS_KEY')
  });

  await publishCommand(
    releaseVersion,
    {
      downloadCenter,
      github,
      wait,
      probePlatformDownloadLink
    }
  );
}

module.exports = {
  releaseBeta,
  releaseGa,
  checkout,
  changelog,
  publish
};


