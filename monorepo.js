const childProcess = require('child_process');
const fs = require('fs-extra');
const path = require('path');

// Directory we create the lerna mono repo in.
// Eventually we'll run this script with the main compass
// folder as target. For now putting things in one nested place
// helps development and teardown.
const TARGET_DIR = 'monorepo-compass';

// The CLONE_DIR is where we clone repos before we import them in lerna.
// We use it to cache the clones while we develop as well.
const CLONE_DIR = 'monorepo-clone';

const packagesToImport = {
  compass: 'https://github.com/mongodb-js/compass'
};

function runInDir(command, dir) {
  childProcess.execSync(command, { stdio: 'inherit', cwd: dir });
}

function initializeMonorepo() {
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR);
  }

  if (!fs.existsSync(CLONE_DIR)) {
    fs.mkdirSync(CLONE_DIR);
  }

  // https://github.com/lerna/lerna/blob/main/commands/init
  runInDir(
    'lerna init --independent', TARGET_DIR
  );

  console.log('Initialized lerna.');
}

function importSinglePackage(packageName, repoUrl) {
  const clonedDir = cloneOrUpdate(packageName, repoUrl);

  const packageFolder = packageName.split('/').reverse()[0];

  if (process.env.IMPORT_STRATEGY === 'lerna') {
    // https://github.com/lerna/lerna/tree/main/commands/import
    runInDir(
      `lerna import -y --flatten --preserve-commit ${clonedDir}`,
      TARGET_DIR
    );
  } else {
    runInDir(`cp -R ${clonedDir} ${TARGET_DIR}/packages/${packageFolder}`);
    runInDir(`rm -Rf ${TARGET_DIR}/packages/${packageFolder}/.git`);
  }

  runInDir(`rm -Rf ${TARGET_DIR}/packages/${packageFolder}/.github`);
  runInDir(`rm -Rf ${TARGET_DIR}/packages/${packageFolder}/node_modules`);
}

function importCompassReposIntoLerna() {
  console.log('Importing packages into lerna...');
  for (const [packageName, repo] of Object.entries(packagesToImport)) {
    console.log(`Importing ${packageName}`);
    importSinglePackage(packageName, repo);
    console.log(`Imported ${packageName}`);
  }
  console.log('Done importing packages.');
}

function cloneOrUpdate(packageName, repo) {
  if (!fs.existsSync(`${CLONE_DIR}/${packageName}`)) {
    runInDir(`git clone ${repo} ${packageName}`, CLONE_DIR);
    runInDir('sleep 1');
  } else {
    runInDir('git pull', `${CLONE_DIR}/${packageName}`);
  }

  return path.resolve(`${CLONE_DIR}/${packageName}`);
}

function runMonorepo() {
  console.log('Running monorepo script...');

  // 1. Setup lerna and the monorepo structure.
  initializeMonorepo();

  // 2. Move the packages into lerna.
  importCompassReposIntoLerna();

  console.log('Done running monorepo script.');
}

runMonorepo();
