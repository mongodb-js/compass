// Publishes all the unpublished packages in topological order.

const childProcess = require('child_process');

function isDirty() {
  const stdout = childProcess.execSync('git status --porcelain');
  return stdout.toString().trim().length > 0;
}

function getCurrentBranch() {
  const stdout = childProcess.execSync('git rev-parse --abbrev-ref HEAD');
  return stdout.toString().trim();
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

const MAIN_BRANCH = 'master';

function main() {
  const currentBranch = getCurrentBranch();

  if (currentBranch !== MAIN_BRANCH) {
    fail('You can only publish from the main branch');
  }

  if (isDirty()) {
    fail('The repo is not pristine');
  }

  const packages = JSON.parse(childProcess.execSync('lerna list --json --toposort'));
  for (const package of packages) {
    if (package.private) {
      continue;
    }

    publishPackage(package);
  }
}

function publishPackage({ location: packageLocation, name: packageName, version: packageVersion }) {
  console.log('\n');
  const packageNameAndVersion = `${packageName}@${packageVersion}`;

  if (alreadyPublished(packageLocation, packageNameAndVersion)) {
    console.log('Already published', packageNameAndVersion, 'skipping ...');
    return;
  }

  console.log('Publishing package', packageNameAndVersion, '...');

  installAndPublish(packageLocation);
}

function installAndPublish(packageLocation) {
  const proc = childProcess.spawnSync('npm', ['install'], {
    cwd: packageLocation, stdio: 'inherit', stdin: 'inherit' });

  const {status: installExitCode} = proc;

  if (installExitCode !== 0) {
    throw new Error(`npm install failed with exit code = ${installExitCode}`);
  }

  const {status: publishExitCode} = childProcess.spawnSync('npm', ['publish', '--access', 'public'], {
    cwd: packageLocation, stdio: 'inherit', stdin: 'inherit' });

  if (publishExitCode !== 0) {
    throw new Error(`npm publish failed with exit code = ${publishExitCode}`);
  }
}

function alreadyPublished(packageLocation, packageNameAndVersion) {
  try {
    const stdout = childProcess.execSync(`npm view ${packageNameAndVersion} --json`, { cwd: packageLocation });
    JSON.parse(stdout.toString().trim());
    // if this command returns a json that can be parsed then the package exists
    return true;
  } catch {
    return false;
  }
}

main();