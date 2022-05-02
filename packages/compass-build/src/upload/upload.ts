/**
 * Upload release assets to GitHub and S3.
 */
import fs from 'fs';

import { Octokit } from '@octokit/rest';
import { GithubRepo } from '@mongodb-js/devtools-github-repo';

// import Target from '../lib/target';

// import downloadCenter from '../lib/download-center';

async function maybePublishGitHubRelease(target) {
  if (!process.env.GITHUB_TOKEN) {
    console.warn(
      'Skipping publish release because process.env.GITHUB_TOKEN not set.'
    );
    return;
  }

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  const repo = new GithubRepo(
    {
      owner: 'mongodb-js',
      repo: 'compass',
    },
    octokit
  );

  const releaseTag = `v${target.version}`;

  const release = {
    name: target.version,
    tag: releaseTag,
    notes: `Release v${target.version}`,
  };

  // NOTE: this will correctly fail if not in draft, so it won't override
  // already published releases.
  await repo.updateDraftRelease(release);

  const uploads = target.assets.map(async function (asset) {
    console.info(
      `${asset.name}: upload to Github release ${releaseTag} started (path: ${asset.path}).`
    );
    await repo.uploadReleaseAsset(releaseTag, {
      name: asset.name,
      path: asset.path,
    });

    console.info(
      `${asset.name}: upload to Github release ${releaseTag} completed.`
    );
  });

  await Promise.all(uploads);
}

exports.command = 'upload [options]';

exports.describe = 'Upload assets from `release`.';

exports.builder = {
  dir: {
    description: 'Project root directory',
    default: process.cwd(),
  },
  version: {
    description: 'Target version',
    default: undefined,
  },
  platform: {
    description: 'Target platform',
    default: undefined,
  },
  arch: {
    description: 'Target arch',
    default: undefined,
  },
};

exports.handler = function (argv) {
  console.argv = argv;

  if (argv.options) {
    process.env.HADRON_DISTRIBUTION = argv.options;
  }

  const target = new Target(argv.dir, {
    version: argv.version,
    platform: argv.platform,
    arch: argv.arch,
  });

  if (target.channel === 'dev') {
    console.info('Skipping publish GitHub release for dev channel.');
    return;
  }

  if (process.env.CI && !process.env.EVERGREEN_PROJECT) {
    console.warn(
      'Trying to publish a release from non-Evergreen CI environment'
    );
    return;
  }

  if (process.env.EVERGREEN_PROJECT) {
    const projectChannel = process.env.EVERGREEN_PROJECT.split('-').pop();
    if (!['stable', 'testing'].includes(projectChannel)) {
      console.warn(
        `Trying to publish a release from unsupported Evergreen project. Expected stable or testing, got ${projectChannel}`
      );
      return;
    }
    const channelToProjectMap = {
      testing: 'beta',
    };
    const mappedChannel = channelToProjectMap[projectChannel] || projectChannel;
    if (target.channel !== mappedChannel) {
      console.warn(
        `Trying to publish a release from mismatched channel. Expected ${target.channel}, got ${mappedChannel}`
      );
      return;
    }
  }

  target.assets = target.assets.filter(function (asset) {
    // eslint-disable-next-line no-sync
    const exists = fs.existsSync(asset.path);
    if (!exists) {
      console.warn(
        `Excluding ${asset.path} from upload because it does not exist.`
      );
    }
    return exists;
  });

  maybePublishGitHubRelease(target)
    .then(() => downloadCenter.maybeUpload(target))
    .catch(abortIfError);
};
