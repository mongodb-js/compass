const execa = require('execa');

async function checkout(releaseBranchName) {
  try {
    await execa('git', ['checkout', '-b', releaseBranchName]);
  } catch {
    await execa('git', ['checkout', releaseBranchName]);
  }
}

async function isDirty() {
  const { stdout } = await execa('git', ['status', '--porcelain']);
  return stdout.toString().trim().length > 0;
}

async function add(file) {
  await execa('git', ['add', file]);
}

async function getCurrentBranch() {
  const { stdout } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
  return stdout.toString().trim();
}

async function commit(message) {
  await execa('git', ['commit', '-m', message]);
}

async function tag(name) {
  await execa('git', ['tag', '-a', name, '-m', name]);
}

async function push(branch) {
  await execa('git', ['push', 'origin', branch]);
}

async function pushTags() {
  await execa('git', ['push', '--tags']);
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
