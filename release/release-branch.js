const RELEASE_BRANCH_RE = /^(\d+)\.(\d+)-releases$/;

function isReleaseBranch(branch) {
  return !!branch.match(RELEASE_BRANCH_RE);
}

function buildReleaseBranchName(version) {
  return `${version}-releases`;
}

module.exports = {
  isReleaseBranch,
  buildReleaseBranchName
};
