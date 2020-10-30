/* eslint-disable camelcase */

const { Octokit } = require('@octokit/rest');
const delay = require('delay');
const env = require('./env');

const REPO = {
  owner: 'mongodb-js',
  repo: 'compass'
};

function createOctokit() {
  return new Octokit({
    auth: env.requireEnvVar('GITHUB_ACCESS_TOKEN')
  });
}

async function getReleaseByTag(tag) {
  const octokit = createOctokit();

  const releases = await octokit
    .paginate('GET /repos/:owner/:repo/releases', REPO);

  return releases.find(({ tag_name }) => tag_name === tag);
}

module.exports = { getReleaseByTag };

