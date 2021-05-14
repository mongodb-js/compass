/**
 * This script is used to check the archived status of the
 * repositories of Compass packages which have been moved into this
 * repository in the `packages` folder.
 */

const compassDepsList = require('./compass-deps-list');

// Archive using octokit github rest api client:
// https://octokit.github.io/rest.js/v18#git

const { Octokit } = require('@octokit/rest');

const octokit = new Octokit();

const GITHUB_REPO_OWNER = 'mongodb-js';

// There is a package which is private archived, which we can
// skip in this script.
const reposToSkip = ['compass-find-in-page']

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getReposAndTheirArchivedStatus() {
  const reposWithArchivedStatus = [];

  for (const compassDep of compassDepsList) {
    if (reposToSkip.includes(compassDep.repositoryName)) {
      continue;
    }

    const repo = await octokit.rest.repos.get({
      owner: GITHUB_REPO_OWNER,
      repo: compassDep.repositoryName
    });

    reposWithArchivedStatus.push({
      repo: compassDep.repositoryName,
      archived: repo.data.archived
    });

    console.log(
      'Repository',
      compassDep.repositoryName,
      'is archived:',
      repo.data.archived ? 'yes' : 'no'
    );

    // Await a few ms to avoid rate limits.
    await delay(50 /* ms */);
  }

  return reposWithArchivedStatus;
}

function printArchivedStatusOfRepos(repos) {
  for (const repo of repos) {
    console.log(
      'Repository',
      repo.repo,
      'is archived:',
      repo.archived ? 'yes' : 'no'
    );
  }
}

async function runPrintArchiveStatusOfRepos() {
  const reposWithArchivedStatus = await getReposAndTheirArchivedStatus();

  // printArchivedStatusOfRepos(reposWithArchivedStatus);

  console.log();
  console.log('All done');
}

process.on('unhandledRejection', (err) => {
  console.error();
  console.error(err.stack || err.message || err);
});

runPrintArchiveStatusOfRepos();

