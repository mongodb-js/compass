// eslint-disable-next-line strict
'use strict';

/**
 * Upload release assets to GitHub and S3.
 */
const { Octokit } = require('@octokit/rest');
const { GitHubRepo } = require('./../lib/github-repo');

const cli = require('mongodb-js-cli')('hadron-build:upload');
const abortIfError = cli.abortIfError.bind(cli);
const Target = require('../lib/target');

const downloadCenter = require('../lib/download-center');

async function maybePublishGitHubRelease(target) {
  if (target.channel === 'dev') {
    cli.info('Skipping publish GitHub release for dev channel.');
  }

  if (!process.env.GITHUB_TOKEN) {
    cli.warn('Skipping publish release because process.env.GITHUB_TOKEN not set.');
  }

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
  });

  const repo = new GitHubRepo({
    owner: 'mongodb-js',
    repo: 'compass'
  }, octokit);

  const releaseTag = `v${target.version}`;

  const release = {
    name: target.version,
    tag: releaseTag,
    notes: `Release v${target.version}`
  };

  // NOTE: this will correctly fail if not in draft, so it won't override
  // already published releases.
  await repo.updateDraftRelease(release);

  const uploads = target.assets.map(
    async function(asset) {
      cli.info(`Starting upload ${asset.name} to Github (path: ${asset.path})`);
      await repo.uploadReleaseAsset(releaseTag, {
        name: asset.name,
        path: asset.path
      });

      cli.info(`Upload of ${asset.name} to Github done.`);
    }
  );

  await Promise.all(uploads);
}

exports.command = 'upload [options]';

exports.describe = 'Upload assets from `release`.';

exports.builder = {
  dir: {
    description: 'Project root directory',
    default: process.cwd()
  }
};

exports.handler = function(argv) {
  cli.argv = argv;

  if (argv.options) {
    process.env.HADRON_DISTRIBUTION = argv.options;
  }

  var fs = require('fs');
  var target = new Target(argv.dir);

  target.assets = target.assets.filter(function(asset) {
    // eslint-disable-next-line no-sync
    var exists = fs.existsSync(asset.path);
    if (!exists) {
      cli.warn(`Excluding ${asset.path} from upload because it does not exist.`);
    }
    return exists;
  });

  maybePublishGitHubRelease(target)
    .then(() => downloadCenter.maybeUpload(target))
    .catch(abortIfError);
};
