const { execFileSync } = require('child_process');

function checkout(releaseBranchName) {
  try {
    execFileSync('git', ['checkout', '-b', releaseBranchName]);
  } catch {
    execFileSync('git', ['checkout', releaseBranchName]);
  }
}

function isDirty() {
  const stdout = execFileSync('git', ['status', '--porcelain']);
  return stdout.toString().trim().length > 0;
}

function add(file) {
  execFileSync('git', ['add', file]);
}

function getCurrentBranch() {
  const stdout = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
  return stdout.toString().trim();
}

function commit(message) {
  execFileSync('git', ['commit', '-m', message]);
}

function tag(name) {
  execFileSync('git', ['tag', '-a', name, '-m', name]);
}

function push(branch) {
  execFileSync('git', ['push', 'origin', branch]);
}

function pushTags() {
  execFileSync('git', ['push', '--tags']);
}

module.exports = {
  checkout,
  isDirty,
  add,
  commit,
  tag,
  push,
  pushTags,
  getCurrentBranch
};
