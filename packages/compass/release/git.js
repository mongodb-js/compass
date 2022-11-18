const execa = require('execa');

async function checkout(releaseBranchName) {
  try {
    await execa('git', ['checkout', releaseBranchName]);
  } catch {
    await execa('git', ['checkout', '-b', releaseBranchName]);
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

async function getRemoteBranches() {
  await execa('git', ['fetch', '--all']);
  const { stdout } = await execa('git', ['branch', '-a']);
  return stdout
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.match(/^remotes\/origin/))
    .map((s) => s.replace(/^remotes\/origin\//, ''));
}

async function log(ref1, ref2) {
  const { stdout } = await execa('git', [
    'log',
    '--format=%s',
    `${ref1}...${ref2}`,
  ]);

  return stdout.split('\n').map((line) => line.trim());
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
  getRemoteBranches,
  log,
};
