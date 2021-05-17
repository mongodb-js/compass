const execa = require('execa');
const path = require('path');
const os = require('os');
const fs = require('fs-extra');

const branchName = 'update-readme-with-new-repo-location';

const workingDir = path.resolve(os.tmpdir(), 'compass-repos-moved-to-monorepo');

async function gitCheckout(releaseBranchName) {
  try {
    await execa('git', ['checkout', releaseBranchName]);
  } catch {
    await execa('git', ['checkout', '-b', releaseBranchName]);
  }
}

async function gitAdd(file) {
  await execa('git', ['add', file]);
}

async function gitCommit(message) {
  await execa('git', ['commit', '-m', message]);
}

async function updateReadmeOfRepoWithLinkToNewLocation(repo) {
  const dir = `clone/${repo}`;
  execa.sync('git', [
    'clone',
    `git@github.com:mongodb-js/${repo}.git`,
    dir,
    ], {stdio: 'inherit'}
  )
  console.log('Processing', repo);
  process.chdir(dir);
  // Checkout new 'update-readme-with-new-repo-location' branch.
  console.log(`checkout new "${branchName}" branch`);
  await gitCheckout(branchName);

  // Update the README, adding a link to the new location.
  const newLocation = `https://github.com/mongodb-js/compass/tree/master/packages/${repo}`;
  const readmeFile = 'README.md';
  const readmeContent = fs.readFileSync(readmeFile).toString();
  const updatedReadme = `This project has been moved to ${newLocation}\n${readmeContent}`;
  fs.writeFileSync('README.md', updatedReadme);

  // Commit changes.
  await gitAdd('.')
  await gitCommit('chore: update readme with link to new repo location');
  
  // Push.
  execa.sync('git', [
      'push',
      '--set-upstream',
      'origin',
      branchName
    ], {
      stdio: 'inherit'
    }
  );
}

async function runUpdateReadmesOfReposMovedIntoMonorepo() {
  console.log('Using dir', workingDir, 'now updating readmes of repos...');

  // Move to temp dir.
  await fs.mkdirp(workingDir);
  process.chdir(workingDir);

  // Update a repo's readme.
  // await updateReadmeOfRepoWithLinkToNewLocation('compass-app-stores');

  process.chdir(workingDir);

  console.log();
  console.log('All done');
}

process.on('unhandledRejection', (err) => {
  console.error();
  console.error(err.stack || err.message || err);
});

runUpdateReadmesOfReposMovedIntoMonorepo();
