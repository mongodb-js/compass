const git = require('./git');
const npm = require('./npm');
const confirm = require('./confirm');

const { isReleaseBranch, buildReleaseBranchName } = require('./release-branch');
const { isMainBranch } = require('./main-branch');
const { newBetaVersion, newGaVersion } = require('./bump');

const packageJsonVersion = require('../package.json').version;

function getValidReleaseBranch() {
  const currentBranch = git.getCurrentBranch();

  if (!isReleaseBranch(currentBranch)) {
    throw new Error('The current branch is not a release branch.');
  }

  if (git.isDirty()) {
    throw new Error('You have untracked or staged changes.');
  }

  return currentBranch;
}

async function commitAndPushNewVersion(newSemver, currentBranch) {
  await confirm(`Are you sure you want to bump from ${packageJsonVersion} to ${newSemver} and release?`);

  const newVersionName = `v${newSemver}`;

  npm.version(newSemver);
  git.add('package.json');
  git.commit(newVersionName);
  git.tag(newVersionName);
  git.push(currentBranch);
  git.pushTags();
}

async function releaseBeta() {
  const currentBranch = getValidReleaseBranch();
  const newSemver = newBetaVersion(packageJsonVersion, currentBranch);
  await commitAndPushNewVersion(
    newSemver,
    currentBranch
  );
}

async function releaseGa() {
  const currentBranch = getValidReleaseBranch();
  const newSemver = newGaVersion(packageJsonVersion, currentBranch);
  await commitAndPushNewVersion(
    newSemver,
    currentBranch
  );
}

function checkout(version) {
  if (!isMainBranch(git.getCurrentBranch())) {
    throw new Error('The current branch is not the main branch.');
  }

  const releaseBranchName = buildReleaseBranchName(version);

  if (!isReleaseBranch(releaseBranchName)) {
    throw new Error('Invalid version');
  }

  git.checkout(releaseBranchName);
}

module.exports = {
  releaseBeta,
  releaseGa,
  checkout
};


