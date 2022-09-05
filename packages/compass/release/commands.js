/* eslint-disable no-console */
const { cli } = require('cli-ux');
const chalk = require('chalk');
const pkgUp = require('pkg-up');

const branch = require('./branch');
const bump = require('./bump');
const git = require('./git');
const npm = require('./npm');

const ux = require('./ux');

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

  cli.info(
    '\n\n',
    ux.manualAction(
      `Make sure that ${chalk.bold(evergreenProject)} is building from ${chalk.bold(currentBranch)}:\n`,
      ux.link(`https://evergreen.mongodb.com/projects##${evergreenProject}`)
    ),
    '\n'
  );

  cli.info('Press enter to continue or Ctrl+C to abort....');
  ux.waitForEnter();

  await commitAndPushNewVersion(
    newSemver,
    currentBranch
  );

  cli.info(
    '\n',
    ux.manualAction(
      'Make sure that the build is running in evergreen:\n',
      ux.link(`https://evergreen.mongodb.com/waterfall/${evergreenProject}`)
    ),
    '\n'
  );
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

  const remoteBranches = await git.getRemoteBranches();
  if (!remoteBranches.includes(releaseBranchName)) {
    cli.info(
      '\n',
      ux.manualAction(
        'You just checked out a new release branch that does not exist in the remote. Run:\n',
        ux.command(`git push -u origin ${releaseBranchName}`), '\n',
        'to create the remote branch before proceeding with the release.'
      ),
      '\n'
    );
  }

  cli.info('Switched to branch:', chalk.bold(await git.getCurrentBranch()));
}

module.exports = {
  releaseBeta,
  releaseGa,
  releaseCheckout
};
