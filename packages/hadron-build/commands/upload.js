/**
 * Upload release assets to GitHub and S3.
 */

// eslint-disable-next-line strict
'use strict';

const fs = require('fs');

const { Octokit } = require('@octokit/rest');
const { GithubRepo } = require('@mongodb-js/devtools-github-repo');

const cli = require('mongodb-js-cli')('hadron-build:upload');
const abortIfError = cli.abortIfError.bind(cli);
const Target = require('../lib/target');

const downloadCenter = require('../lib/download-center');

async function maybePublishGitHubRelease(target) {
  if (!process.env.GITHUB_TOKEN) {
    cli.warn('Skipping publish release because process.env.GITHUB_TOKEN not set.');
    return;
  }

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
  });

  const repo = new GithubRepo({
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
      cli.info(`${asset.name}: upload to Github release ${releaseTag} started (path: ${asset.path}).`);
      await repo.uploadReleaseAsset(releaseTag, {
        name: asset.name,
        path: asset.path
      });

      cli.info(`${asset.name}: upload to Github release ${releaseTag} completed.`);
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
  },
  version: {
    description: 'Target version',
    default: undefined
  },
  platform: {
    description: 'Target platform',
    default: undefined
  },
  arch: {
    description: 'Target arch',
    default: undefined
  }
};

exports.handler = function(argv) {
  cli.argv = argv;

  if (argv.options) {
    process.env.HADRON_DISTRIBUTION = argv.options;
  }

  const target = new Target(argv.dir, {
    version: argv.version,
    platform: argv.platform,
    arch: argv.arch
  });

  if (target.channel === 'dev') {
    cli.info('Skipping publish GitHub release for dev channel.');
    return;
  }

  if (process.env.CI && !process.env.EVERGREEN_PROJECT) {
    cli.warn('Trying to publish a release from non-Evergreen CI environment');
    return;
  }

  if (process.env.EVERGREEN_PROJECT) {
    const projectChannel = process.env.EVERGREEN_PROJECT.split('-').pop();
    if (!['stable', 'testing'].includes(projectChannel)) {
      cli.warn(
        `Trying to publish a release from unsupported Evergreen project. Expected stable or testing, got ${projectChannel}`
      );
      return;
    }
    const channelToProjectMap = {
      testing: 'beta'
    };
    const mappedChannel = channelToProjectMap[projectChannel] || projectChannel;
    if (target.channel !== mappedChannel) {
      cli.warn(
        `Trying to publish a release from mismatched channel. Expected ${target.channel}, got ${mappedChannel}`
      );
      return;
    }
  }

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
