const { getMajorMinor, sameMajorAndMinor } = require('./version');

const MAIN_BRANCH_NAME = 'main';
const RELEASE_BRANCH_RE = /^(\d+)\.(\d+)-releases$/;

function isMainBranch(branch) {
  return branch === MAIN_BRANCH_NAME;
}

function isReleaseBranch(branch) {
  return !!branch.match(RELEASE_BRANCH_RE);
}

function buildReleaseBranchName(versionLike) {
  const [major, minor] = getMajorMinor(versionLike);
  return `${major}.${minor}-releases`;
}

function requireReleaseBranch(branch) {
  if (!isReleaseBranch(branch)) {
    throw new Error('not a release branch');
  }
}

function getFirstBeta(branch) {
  requireReleaseBranch(branch);

  const [major, minor] = getMajorMinor(branch);
  return [major, minor, '0-beta.0'].join('.');
}

function getFirstGa(branch) {
  requireReleaseBranch(branch);

  const [major, minor] = getMajorMinor(branch);
  return [major, minor, '0'].join('.');
}

function hasVersion(branch, version) {
  return sameMajorAndMinor(getFirstBeta(branch), version);
}

function lt(releaseBranch, version) {
  const [branchMajor, branchMinor] = getMajorMinor(releaseBranch);
  const [versionMajor, versionMinor] = getMajorMinor(version);

  return (
    branchMajor < versionMajor ||
    (branchMajor === versionMajor && branchMinor < versionMinor)
  );
}

module.exports = {
  isMainBranch,
  isReleaseBranch,
  buildReleaseBranchName,
  getFirstBeta,
  getFirstGa,
  hasVersion,
  lt,
};
