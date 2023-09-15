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
    paths.map(async(assetPath) => {
      const stats = await fs.stat(assetPath);
      if (!stats.isFile()) {
        throw new TypeError(`Not a file at path ${assetPath}`);
      }
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

function versionId(version, distribution = '') {
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

function readablePlatformName(arch, platform, fileName = '') {
  let name = null;

  switch (`${platform}-${arch}`) {
    case 'darwin-x64':
      name = 'macOS 64-bit (10.14+)';
      break;
    case 'darwin-arm64':
      name = 'macOS arm64 (M1) (11.0+)';
      break;
    case 'win32-x64':
      name = 'Windows 64-bit (10+)';
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
        .flatMap(({ assets, config }) => {
          return assets
            .filter(({ downloadCenter }) => {
              return downloadCenter;
            })
            .map((asset) => {
              const link = Target.getDownloadLinkForAsset(version, asset);
              return {
                arch: config.arch,
                os: config.platform,
                name: readablePlatformName(
                  config.arch,
                  config.platform,
                  asset.name
                ),
                download_link: link
              };
            });
        })
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

  const assetsToUpload = assets.flatMap((item) => {
    return item.assets;
  });

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

  cli.info(`Uploading ${assetsToUpload.length} asset(s) to GitHub release:`);
  assetsToUpload.forEach((asset) => {
    cli.info(` - ${path.relative(root, asset.path)}`);
  });
  if (!dryRun) {
    await repo.uploadReleaseAsset(releaseTag, assetsToUpload);
  }
  cli.info('Asset upload complete');
}

async function uploadAssetsToDownloadCenter(assets, channel, dryRun) {
  const assetsToUpload = assets
    .flatMap((item) => {
      return item.assets;
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

function isDeepStrictEqual(a, b) {
  try {
    deepStrictEqual(a, b);
    return true;
  } catch (_) {
    return false;
  }
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
    versions,
    manual_link: 'https://docs.mongodb.org/manual/products/compass',
    release_notes_link: '',
    previous_releases_link: '',
    development_releases_link: '',
    supported_browsers_link: '',
    tutorial_link: ''
  };

  if (isDeepStrictEqual(currentManifest, newManifest)) {
    cli.warn('Skipping upload: manifests are identical');
    return;
  }

  cli.info('Uploading updated manifest');
  diffString(currentManifest, newManifest)
    .trim()
    .split('\n')
    .forEach((line) => {
      cli.info(line);
    });

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
    default: process.env.npm_config_dry_run === 'true'
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
    updateManifest(argv.dryRun).catch(abortIfError);
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
  versionId,
  readableVersionName,
  readablePlatformName,
  generateVersionsForAssets,
  publishGitHubRelease,
  uploadAssetsToDownloadCenter,
  getLatestRelease,
  getLatestReleaseVersions,
  updateManifest
};
