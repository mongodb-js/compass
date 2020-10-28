const MAIN_BRANCH_NAME = 'master';
const RELEASE_BRANCH_RE = /^(\d+)\.(\d+)-releases$/;

function isMainBranch(branch) {
  return branch === MAIN_BRANCH_NAME;
}

function isReleaseBranch(branch) {
  return !!branch.match(RELEASE_BRANCH_RE);
}

function buildReleaseBranchName(version) {
  return `${version}-releases`;
}

module.exports = {
  isMainBranch,
  isReleaseBranch,
  buildReleaseBranchName
};

