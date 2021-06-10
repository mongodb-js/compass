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

const args = process.argv.slice(2);

const npmRegistrySpawnArgs = args.includes('--local') ? ['--registry', 'http://localhost:4873'] : [];

if (args.includes('--local')) {
  childProcess.spawnSync('npm', ['add-user', ...npmRegistrySpawnArgs], {
    stdio: 'inherit', stdin: 'inherit'
  });
}

function main() {

  const currentBranch = getCurrentBranch();

  if (!args.includes('--no-branch-check') && currentBranch !== MAIN_BRANCH) {
    fail('You can only publish from the main branch');
  }

  if (!args.includes('--no-pristine-check') && isDirty()) {
    fail('The repo is not pristine');
  }

  const packages = JSON.parse(childProcess.execSync('lerna list --json --toposort'));
  let i = 0;
  for (const package of packages) {
    publishPackage(package, [++i, packages.length].join(' of '));
  }
}

function publishPackage(
  {
    location: packageLocation,
    name: packageName,
    version: packageVersion,
    private: isPackagePrivate
  },
  progress
) {
  console.log('\n');
  const packageNameAndVersion = `${packageName}@${packageVersion}`;

  console.log(packageNameAndVersion, `(${progress})`);
  
  if (isPackagePrivate) {
    console.log('Updating package-lock only ...');
    updatePackageLockOnly(packageLocation);
    return;
  }

  if (alreadyPublished(packageLocation, packageNameAndVersion)) {
    console.log('Already published, skipping ...');
    return;
  }

  console.log('Publishing package ...');

  installAndPublish(packageLocation);
}

function installAndPublish(packageLocation) {
  const proc = childProcess.spawnSync('npm', ['install', ...npmRegistrySpawnArgs], {
    cwd: packageLocation, stdio: 'inherit', stdin: 'inherit' });

  const {status: installExitCode} = proc;

  if (installExitCode !== 0) {
    throw new Error(`npm install failed with exit code = ${installExitCode}`);
  }

  const {status: publishExitCode} = childProcess.spawnSync('npm', ['publish', '--access', 'public', ...npmRegistrySpawnArgs], {
    cwd: packageLocation, stdio: 'inherit', stdin: 'inherit' });

  if (publishExitCode !== 0) {
    throw new Error(`npm publish failed with exit code = ${publishExitCode}`);
  }
}

function updatePackageLockOnly(packageLocation) {
  const proc = childProcess.spawnSync(
    'npm',
    ['install', '--package-lock-only', ...npmRegistrySpawnArgs],
    {
      cwd: packageLocation,
      stdio: 'inherit',
      stdin: 'inherit'
    }
  );

  const { status: installExitCode } = proc;

  if (installExitCode !== 0) {
    throw new Error(`npm install failed with exit code = ${installExitCode}`);
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