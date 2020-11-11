/* eslint-disable camelcase */
const { Octokit } = require('@octokit/rest');
const wait = require('./wait');

const REPO = {
  owner: 'mongodb-js',
  repo: 'compass'
};

// NOTE: github has a rate limit for unauthenticated
// request of 60 per hour:
const WAIT_OPTIONS = { delay: 5 /* minutes */ * 60 * 1000 };

async function getRelease(tagOrVersion) {
  const tag = tagOrVersion.startsWith('v') ? tagOrVersion : `v${tagOrVersion}`;
  const octokit = new Octokit();

  const releases = await octokit
    .paginate('GET /repos/:owner/:repo/releases', REPO);

  return releases.find(({ tag_name }) => tag_name === tag);
}

async function waitForReleasePublished(tagOrVersion) {
  return await wait(
    () => getRelease(tagOrVersion).then((release) => release && !release.draft),
    WAIT_OPTIONS
  );
}

module.exports = { waitForReleasePublished };

