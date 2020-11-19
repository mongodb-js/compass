/* eslint-disable camelcase */
const { Octokit } = require('@octokit/rest');

const REPO = {
  owner: 'mongodb-js',
  repo: 'compass'
};


async function getRelease(tagOrVersion) {
  const tag = tagOrVersion.startsWith('v') ? tagOrVersion : `v${tagOrVersion}`;
  const octokit = new Octokit();

  const releases = await octokit
    .paginate('GET /repos/:owner/:repo/releases', REPO);

  return releases.find(({ tag_name }) => tag_name === tag);
}

async function isReleasePublished(tagOrVersion) {
  // NOTE: github has a rate limit for unauthenticated
  // request of 60 per hour
  const release = await getRelease(tagOrVersion);
  return release && !release.draft;
}

module.exports = { isReleasePublished };

