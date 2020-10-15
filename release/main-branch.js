const MAIN_BRANCH_NAME = 'master';

function isMainBranch(branch) {
  return branch === MAIN_BRANCH_NAME;
}

module.exports = {
  isMainBranch
};
