const execa = require('execa');
const semver = require('semver');

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

async function getTags() {
  await execa('git', ['fetch', '--all', '--tags']);
  const { stdout } = await execa('git', ['tag']);
  return stdout.split('\n');
}

async function log(ref1, ref2) {
  const { stdout } = await execa('git', [
    'git',
    'log',
    '--format="%C(auto) %h %s"',
    `${ref1}...${ref2}`
  ]);

  return stdout.split('\n');
}

module.exports = {
  checkout,
  isDirty,
  add,
  commit,
  tag,
  push,
  pushTags,
  getCurrentBranch,
  getTags,
  log
};
