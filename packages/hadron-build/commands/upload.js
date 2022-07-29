/* eslint-disable no-nested-ternary */
/* eslint-disable complexity */
/**
 * Upload release assets to GitHub and S3.
 */

// eslint-disable-next-line strict
'use strict';
const path = require('path');
const os = require('os');
const { promises: fs } = require('fs');
const { deepStrictEqual } = require('assert');
const { Octokit } = require('@octokit/rest');
const { GithubRepo } = require('@mongodb-js/devtools-github-repo');
const { diffString } = require('json-diff');
const download = require('download');
const Target = require('../lib/target');
const {
  getKeyPrefix,
  downloadManifest,
  uploadAsset,
  uploadManifest
} = require('../lib/download-center');

const cli = require('mongodb-js-cli')('hadron-build:upload');
const abortIfError = cli.abortIfError.bind(cli);
const root = path.resolve(__dirname, '..', '..', '..');

async function checkAssetsExist(paths) {
  await Promise.all(
    paths.map((assetPath) => {
      return fs.stat(assetPath);
    })
  );
  return true;
}

function isBeta(id) {
  return /-beta.\d+/.test(id);
}

function isStable(id) {
  return !isBeta(id);
}

const distributionLabel = {
  'compass-readonly': 'Readonly Edition',
  'compass-isolated': 'Isolated Edition'
};

const channelLabel = {
  stable: 'Stable',
  beta: 'Beta'
};

function versionId(version, distribution) {
  return [version, distribution.replace(/compass\-?/, '')]
    .filter(Boolean)
    .join('-');
}

function readableVersionName(version, channel, distribution) {
  const desc = [distributionLabel[distribution], channelLabel[channel]]
    .filter(Boolean)
    .join(' ');
  return `${version} ${desc ? `(${desc})` : ''}`.trim();
}

function readablePlatformName(arch, platform, fileName) {
  let name = null;

  switch (`${platform}-${arch}`) {
    case 'darwin-x64':
      name = 'macOS 64-bit (10.14+)';
      break;
    case 'darwin-arm64':
      name = 'macOS arm64 (M1) (11.0+)';
      break;
    case 'win32-x64':
      name = 'Windows 64-bit (7+)';
      break;
    case 'linux-x64':
      name = fileName.endsWith('.rpm')
        ? 'RedHat 64-bit (7+)'
        : 'Ubuntu 64-bit (16.04+)';
      break;
    default:
      throw new Error(
        `Unexpected asset for the download center: ${platform} ${arch} ${fileName}`
      );
  }

  if (fileName.endsWith('.zip')) {
    name += ' (Zip)';
  }

  if (fileName.endsWith('.msi')) {
    name += ' (MSI)';
  }

  return name;
}

function generateVersionsForAssets(assets, version, channel) {
  return Target.supportedDistributions.map((distribution) => {
    return {
      _id: versionId(version, distribution),
      version: readableVersionName(version, channel, distribution),
      platform: assets
        .filter((asset) => {
          return asset.config.distribution === distribution;
        })
        // eslint-disable-next-line no-shadow
        .map(({ assets, config }) => {
          return assets
            .filter(({ downloadCenter }) => {
              return downloadCenter;
            })
            .map(({ name }) => {
              const prefix = getKeyPrefix(channel);
              const link = `https://downloads.mongodb.com/${prefix}/${name}`;
              return {
                arch: config.arch,
                os: config.platform,
                name: readablePlatformName(config.arch, config.platform, name),
                download_link: link
              };
            });
        })
        .flat()
    };
  });
}

async function publishGitHubRelease(assets, version, channel, dryRun) {
  if (!dryRun && !process.env.GITHUB_TOKEN) {
    throw new Error(
      "Can't publish a release because process.env.GITHUB_TOKEN not set."
    );
  }

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
  });

  const repo = new GithubRepo(
    {
      owner: 'mongodb-js',
      repo: 'compass'
    },
    octokit
  );

  const releaseTag = `v${version}`;

  const release = {
    name: version,
    tag: releaseTag,
    notes: `Release v${version}`
  };

  cli.info('Updating draft release…');
  JSON.stringify(release, null, 2)
    .split('\n')
    .forEach((line) => {
      cli.info(line);
    });

  if (!dryRun) {
    // NOTE: This will correctly fail if not in draft, so it won't override
    // already published releases.
    await repo.updateDraftRelease(release);
  }

  const assetsToUpload = assets
    .map((item) => {
      return item.assets;
    })
    .flat();

  const versionManifest = generateVersionsForAssets(assets, version, channel);

  const versionManifestPath = path.join(
    os.tmpdir(),
    `version-manifest-${version}-${Date.now()}.json`
  );

  await fs.writeFile(
    versionManifestPath,
    JSON.stringify(versionManifest, null, 2)
  );

  assetsToUpload.push({ name: 'manifest.json', path: versionManifestPath });

  cli.info('Uploading assets to GitHub release…');

  await checkAssetsExist(
    assetsToUpload.map((asset) => {
      return asset.path;
    })
  );

  const uploads = assetsToUpload.map(async(asset) => {
    cli.info(
      `${
        asset.name
      }: upload to Github release ${releaseTag} started (path: ${path.relative(
        root,
        asset.path
      )}).`
    );
    if (!dryRun) {
      await repo.uploadReleaseAsset(releaseTag, {
        name: asset.name,
        path: asset.path
      });
    }
    cli.info(
      `${asset.name}: upload to Github release ${releaseTag} completed.`
    );
  });

  await Promise.all(uploads);
}

async function uploadAssetsToDownloadCenter(assets, channel, dryRun) {
  const assetsToUpload = assets
    .map((item) => {
      return item.assets;
    })
    .flat()
    .filter(({ downloadCenter }) => {
      return downloadCenter;
    });

  cli.info('Uploading assets to download center…');

  await checkAssetsExist(
    assetsToUpload.map((asset) => {
      return asset.path;
    })
  );

  const uploads = assetsToUpload.map(async(asset) => {
    cli.info(
      `${asset.name}: upload to download center started (path: ${path.relative(
        root,
        asset.path
      )}).`
    );
    if (!dryRun) {
      await uploadAsset(channel, asset);
    }
    cli.info(`${asset.name}: upload to download center completed.`);
  });

  await Promise.all(uploads);
}

/**
 *
 * @param {'stable' | 'beta'} channel
 */
async function getLatestRelease(channel = 'stable') {
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
  });

  const page = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    let releases = [];

    try {
      const { data } = await octokit.request(
        'GET /repos/{owner}/{repo}/releases',
        {
          owner: 'mongodb-js',
          repo: 'compass',
          per_page: 100,
          page
        }
      );
      releases = data;
    } catch (err) {
      cli.warn(`Failed to fetch releases: ${err.message}`);
    }

    // We ran out of releases or failed to fetch
    if (releases.length === 0) {
      return null;
    }

    const latestRelease = releases.find((release) => {
      return (
        !release.draft &&
        (channel === 'beta'
          ? isBeta(release.tag_name)
          : isStable(release.tag_name))
      );
    });

    if (latestRelease) {
      return latestRelease;
    }

    page++;
  }
}

function getDiffFromAssertionError(message) {
  return message.split(/\+ actual.+?\n/)[1];
}

async function getLatestReleaseVersions(channel = 'stable') {
  const release = await getLatestRelease(channel);
  if (!release) {
    throw new Error(`Couldn't find latest release for ${channel} channel`);
  }
  const manifest = release.assets.find((asset) => {
    return asset.name === 'manifest.json';
  });
  if (!manifest) {
    throw new Error(`No manifest found in the release for ${channel} channel`);
  }
  const content = JSON.parse(
    (await download(manifest.browser_download_url)).toString()
  );
  return content;
}

async function updateManifest(dryRun) {
  cli.info('Downloading current manifest');
  const currentManifest = await downloadManifest();

  const versions = (
    await Promise.all(
      ['stable', 'beta'].map((channel) => {
        cli.info(`Looking for the latest release for the ${channel} channel`);
        return getLatestReleaseVersions(channel);
      })
    )
  ).flat();

  const newManifest = {
    ...currentManifest,
    versions
  };

  try {
    deepStrictEqual(currentManifest, newManifest);
    cli.warn('Skipping upload: manifests are identical');
    return;
  } catch (_) {
    cli.info('Uploading updated manifest');
    diffString(currentManifest, newManifest)
      .trim()
      .split('\n')
      .forEach((line) => {
        cli.info(line);
      });
  }

  if (!dryRun) {
    // NB: This will also validate the schema and that download_link assets
    // exist before updating
    await uploadManifest(newManifest);
  }
}

const command = 'upload [options]';

const describe = 'Upload assets from `release`.';

const builder = {
  dir: {
    description: 'Project root directory',
    default: process.cwd()
  },
  version: {
    description: 'Target version',
    default: require(path.join(process.cwd(), 'package.json')).version
  },
  manifest: {
    description:
      'Upload download center manifest update for the target version (NOTE: This will will replace existing version for the channel with the provided one for all existing and newly added assets)',
    default: false
  },
  ['dry-run']: {
    description:
      'Does everything the real script will do without actually publishing assets to GH / download center',
    default: false
  }
};

const handler = function handler(argv) {
  cli.argv = argv;
  argv.version = argv.version.replace(/^v/, '');
  const channel = Target.getChannelFromVersion(argv.version);
  const assets = Target.getAssetsForVersion(argv.dir, argv.version);

  if (argv.dryRun) {
    cli.warn('Running script in dry-run mode. Skipping checks and publishing');
  }

  if (!argv.dryRun && !['stable', 'beta'].includes(channel)) {
    cli.error(`Skipping publish release for ${channel} channel.`);
    return;
  }

  if (!argv.dryRun && !process.env.CI) {
    cli.error('Trying to publish a release from non-CI environment');
    return;
  }

  if (argv.manifest) {
    updateManifest(assets, argv.version, channel, argv.dryRun).catch(
      abortIfError
    );
    return;
  }

  // Rest of the checks apply only for assets publishing

  if (!argv.dryRun && process.env.CI && !process.env.EVERGREEN_PROJECT) {
    cli.error('Trying to publish assets from non-Evergreen CI environment');
    return;
  }

  if (!argv.dryRun && process.env.EVERGREEN_PROJECT) {
    const projectChannel = process.env.EVERGREEN_PROJECT.split('-').pop();
    if (!['stable', 'testing'].includes(projectChannel)) {
      cli.error(
        `Trying to publish assets from unsupported Evergreen project. Expected stable or testing, got ${projectChannel}`
      );
      return;
    }
    const channelToProjectMap = {
      testing: 'beta'
    };
    const mappedChannel = channelToProjectMap[projectChannel] || projectChannel;
    if (channel !== mappedChannel) {
      cli.error(
        `Trying to publish assets from mismatched channel. Expected ${channel}, got ${mappedChannel}`
      );
      return;
    }
  }

  publishGitHubRelease(assets, argv.version, channel, argv.dryRun)
    .then(() => {
      return uploadAssetsToDownloadCenter(assets, channel, argv.dryRun);
    })
    .catch(abortIfError);
};

module.exports = {
  command,
  describe,
  builder,
  handler,
  getLatestRelease,
  updateManifest,
  generateVersionsForAssets
};
