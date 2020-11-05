/* eslint-disable no-console */
const _ = require('lodash');
const { cli } = require('cli-ux');
const chalk = require('chalk');
const pkgUp = require('pkg-up');
const semver = require('semver');

const branch = require('./branch');
const bump = require('./bump');
const CompassDownloadCenter = require('./download-center');
const env = require('./env');
const git = require('./git');
const github = require('./github');
const npm = require('./npm');
const version = require('./version');

const publishRelease = require('./publish');
const waitForAssets = require('./wait-for-assets');

async function getPackageJsonVersion() {
  return require(await pkgUp()).version;
}

async function getValidReleaseBranch() {
  const currentBranch = await git.getCurrentBranch();

  if (!branch.isReleaseBranch(currentBranch)) {
    throw new Error(`The current branch (${currentBranch}) is not a release branch.`);
  }

  return currentBranch;
}

async function commitAndPushNewVersion(newSemver, currentBranch) {
  const newVersionName = `v${newSemver}`;

  cli.action.start(`bumping npm version to ${newVersionName}`);
  await npm.version(newSemver);
  cli.action.stop();

  cli.action.start('staging and tagging changes');
  await git.add('package.json');
  await git.add('package-lock.json');
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

async function startRelease(bumpFn, evergreenProject) {
  const downloadCenter = createDownloadCenter();

  const packageJsonVersion = await getPackageJsonVersion();
  const currentBranch = await getValidReleaseBranch();

  await ensureNoDirtyRepo();

  const newSemver = bumpFn(packageJsonVersion, currentBranch);

  const answer = await cli.confirm(
    `Are you sure you want to bump from ${chalk.bold(packageJsonVersion)} `
    + `to ${chalk.bold(newSemver)} and release?`
  );

  if (!answer) {
    cli.info('cancelled.');
    return;
  }

  cli.info('');
  cli.info(
    chalk.bgYellow(
      chalk.gray(
        chalk.bold(' MANUAL ACTION REQUIRED!: '))
    ),
    `Make sure that ${evergreenProject} is building from ${currentBranch}:\n` +
    `\thttps://evergreen.mongodb.com/projects##${evergreenProject}`
  );

  cli.anykey('Press any key to continue.');

  await commitAndPushNewVersion(
    newSemver,
    currentBranch
  );

  cli.info('');
  cli.info(
    chalk.bgYellow(
      chalk.gray(
        chalk.bold(' MANUAL ACTION REQUIRED!: '))
    ),
    'Make sure that the build is running in evergreen:\n' +
    `\thttps://evergreen.mongodb.com/waterfall/${evergreenProject}`
  );

  await waitForAssets(newSemver, { downloadCenter });
}

async function ensureNoDirtyRepo() {
  if (await git.isDirty()) {
    throw new Error('You have untracked or staged changes.');
  }
}

async function releaseBeta() {
  await startRelease(bump.newBeta, '10gen-compass-testing');
}

async function releaseGa() {
  await startRelease(bump.newGa, '10gen-compass-stable');
}

async function releaseCheckout(versionLike) {
  if (!branch.isMainBranch(await git.getCurrentBranch())) {
    throw new Error('The current branch is not the main branch.');
  }

  const releaseBranchName = branch.buildReleaseBranchName(versionLike);

  if (!branch.isReleaseBranch(releaseBranchName)) {
    throw new Error('Invalid version');
  }

  await git.checkout(releaseBranchName);
}

async function releaseChangelog() {
  await getValidReleaseBranch();
  const releaseVersion = await getPackageJsonVersion();
  const tags = await git.getTags();
  const releaseTag = `v${releaseVersion}`;
  const isGaRelease = version.isGa(releaseTag);

  if (!tags.includes(releaseTag)) {
    throw new Error(`The release tag ${releaseTag} was not found. Is this release tagged?`);
  }

  // finds the first tag that is lower than releaseTag
  const previousTag = tags
    .filter((t) => t.startsWith('v') && semver.valid(t))
    .filter((t) => isGaRelease ? version.isGa(t) : true) // if is GA only consider other GAs
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

async function releasePublish() {
  const releaseBranch = await getValidReleaseBranch();
  await ensureNoDirtyRepo();

  const releaseVersion = await getPackageJsonVersion();

  // Exits if the releaseVersion does not match the release branch:
  if (!branch.hasVersion(releaseBranch, releaseVersion)) {
    throw new Error(
      `${releaseVersion} can only be published from ${branch.buildReleaseBranchName(releaseVersion)}`);
  }

  // Exits if a tag does not exists
  const tags = await git.getTags();
  const releaseTag = tags.find((t) => t === `v${releaseVersion}`);
  if (!releaseTag) {
    throw new Error(
      `No tag found for ${releaseVersion}. Did "npm run release <beta|ga>" succeed?`);
  }

  const answer = await cli.confirm(
    `Are you sure you want to publish the release ${chalk.bold(releaseVersion)}?`);
  if (!answer) {
    return;
  }

  await publishRelease(releaseVersion, {
    downloadCenter: createDownloadCenter(),
    github
  });
}

async function releaseWait() {
  await getValidReleaseBranch();
  const releaseVersion = await getPackageJsonVersion();

  await waitForAssets(releaseVersion, {
    downloadCenter: createDownloadCenter()
  });
}

module.exports = {
  releaseBeta,
  releaseGa,
  releaseCheckout,
  releaseChangelog,
  releasePublish,
  releaseWait
};

function createDownloadCenter() {
  return new CompassDownloadCenter({
    accessKeyId: env.requireEnvVar('MONGODB_DOWNLOADS_AWS_ACCESS_KEY_ID'),
    secretAccessKey: env.requireEnvVar('MONGODB_DOWNLOADS_AWS_SECRET_ACCESS_KEY')
  });
}

