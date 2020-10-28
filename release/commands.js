/* eslint-disable no-console */
const pkgUp = require('pkg-up');
const git = require('./git');
const npm = require('./npm');
const { confirm, task } = require('./ui');

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
  const answer = await confirm(
    `Are you sure you want to bump from ${packageJsonVersion} to ${newSemver} and release?`
  );

  if (!answer) {
    console.info('cancelled.');
    return;
  }

  const newVersionName = `v${newSemver}`;

  await task(`bumping npm version to ${newVersionName}`, async() => {
    await npm.version(newSemver);
  });

  await task('staging and tagging changes', async() => {
    await git.add('package.json');
    await git.commit(newVersionName);
    await git.tag(newVersionName);
  });

  await task(`pushing changes in ${currentBranch}`, async() => {
    await git.push(currentBranch);
  });

  await task('pushing tags', async() => {
    await git.pushTags();
  });
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

module.exports = {
  releaseBeta,
  releaseGa,
  checkout
};


