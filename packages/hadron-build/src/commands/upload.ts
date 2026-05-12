/* eslint-disable no-nested-ternary */
/* eslint-disable complexity */
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
import { deepStrictEqual } from 'assert';
import semver from 'semver';
import { Octokit } from '@octokit/rest';
import { GithubRepo } from '@mongodb-js/devtools-github-repo';
import { diffString } from 'json-diff';
import download from 'download';
import type { Asset, TargetAssets } from '../../lib/target';
import Target from '../../lib/target';
import {
  downloadManifest,
  uploadAsset,
  uploadAssetNew,
  uploadManifest,
} from '../../lib/download-center';
import { getBuildAttestations } from '../../lib/build-attestations';
import createCLI from 'mongodb-js-cli';

const cli = createCLI('hadron-build:upload');
const abortIfError = cli.abortIfError.bind(cli);
const root = path.resolve(__dirname, '..', '..', '..');

async function checkAssetsExist(paths: string[]): Promise<true> {
  await Promise.all(
    paths.map(async (assetPath) => {
      const stats = await fs.stat(assetPath);
      if (!stats.isFile()) {
        throw new TypeError(`Not a file at path ${assetPath}`);
      }
    })
  );
  return true;
}

function isBeta(id: string): boolean {
  return /-beta.\d+/.test(id);
}

function isStable(id: string): boolean {
  return !isBeta(id);
}

const distributionLabel = Object.create({
  'compass-readonly': 'Readonly Edition',
  'compass-isolated': 'Isolated Edition',
});

const channelLabel = Object.create({
  stable: 'Stable',
  beta: 'Beta',
});

export function versionId(version: string, distribution = ''): string {
  return [version, distribution.replace(/compass\-?/, '')]
    .filter(Boolean)
    .join('-');
}

export function readableVersionName(
  version: string,
  channel?: string,
  distribution?: string
): string {
  const desc = [distributionLabel[distribution ?? ''], channelLabel[channel ?? '']]
    .filter(Boolean)
    .join(' ');
  return `${version} ${desc ? `(${desc})` : ''}`.trim();
}

export function readablePlatformName(
  arch: string,
  platform: string,
  fileName = ''
): string {
  let name: string | null = null;

  switch (`${platform}-${arch}`) {
    case 'darwin-x64':
      name = 'macOS x64 (Intel) (11+)';
      break;
    case 'darwin-arm64':
      name = 'macOS arm64 (Apple silicon) (11.0+)';
      break;
    case 'win32-x64':
      name = 'Windows 64-bit (10+)';
      break;
    case 'linux-x64':
      name = fileName.endsWith('.rpm')
        ? 'RedHat 64-bit (8+)'
        : 'Ubuntu 64-bit (20.04+)';
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

interface VersionEntry {
  _id: string;
  version: string;
  platform: {
    arch: string;
    os: string;
    name: string;
    download_link: string;
  }[];
}

export function generateVersionsForAssets(
  assets: TargetAssets[],
  version: string,
  channel: string
): VersionEntry[] {
  return Target.supportedDistributions.map((distribution) => {
    return {
      _id: versionId(version, distribution),
      version: readableVersionName(version, channel, distribution),
      platform: assets
        .filter((asset) => {
          return asset.config.distribution === distribution;
        })
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
                download_link: link,
              };
            });
        }),
    };
  });
}

export async function publishGitHubRelease(
  assets: TargetAssets[],
  version: string,
  channel: string,
  dryRun: boolean
): Promise<void> {
  if (!dryRun && !process.env.GITHUB_TOKEN) {
    throw new Error(
      "Can't publish a release because process.env.GITHUB_TOKEN not set."
    );
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

  const releaseTag = `v${version}`;

  const release = {
    name: version,
    tag: releaseTag,
    notes: `Release v${version}`,
  };

  cli.info('Updating draft release…');
  JSON.stringify(release, null, 2)
    .split('\n')
    .forEach((line) => {
      cli.info(line);
    });

  if (!dryRun) {
    await repo.updateDraftRelease(release);
  }

  const assetsToUpload: Asset[] = assets.flatMap((item) => {
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

export async function uploadAssetsToDownloadCenter(
  assets: Asset[],
  channel: string,
  dryRun: boolean
): Promise<void> {
  cli.info('Uploading assets to download center…');

  await checkAssetsExist(
    assets.map((asset) => {
      return asset.path;
    })
  );

  const uploads = assets.map(async (asset) => {
    cli.info(
      `${asset.name}: upload to download center started (path: ${path.relative(
        root,
        asset.path
      )}).`
    );
    if (!dryRun) {
      await uploadAsset(channel, asset);
      await uploadAssetNew(channel, asset);
    }
    cli.info(`${asset.name}: upload to download center completed.`);
  });

  await Promise.all(uploads);
}

export async function getLatestRelease(channel = 'stable'): Promise<Record<string, unknown> | null> {
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  let page = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    let releases: Record<string, unknown>[] = [];

    try {
      const { data } = await octokit.request(
        'GET /repos/{owner}/{repo}/releases',
        {
          owner: 'mongodb-js',
          repo: 'compass',
          per_page: 100,
          page,
        }
      );
      releases = data;
    } catch (err) {
      cli.warn(`Failed to fetch releases: ${(err as Error).message}`);
    }

    if (releases.length === 0) {
      return null;
    }

    const latestRelease = (releases as Array<{ tag_name: string; draft: boolean; assets: unknown[] }>)
      .sort((a, b) => {
        if (semver.lt(a.tag_name, b.tag_name)) {
          return 1;
        }
        if (semver.gt(a.tag_name, b.tag_name)) {
          return -1;
        }
        return 0;
      })
      .find((release) => {
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

export async function getLatestReleaseVersions(channel = 'stable'): Promise<unknown> {
  const release = await getLatestRelease(channel);
  if (!release) {
    throw new Error(`Couldn't find latest release for ${channel} channel`);
  }
  const manifest = (release.assets as Array<{ name: string; browser_download_url: string }>).find((asset) => {
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

function isDeepStrictEqual(a: unknown, b: unknown): boolean {
  try {
    deepStrictEqual(a, b);
    return true;
  } catch {
    return false;
  }
}

export async function updateManifest(dryRun: boolean): Promise<void> {
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
    tutorial_link: '',
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
    await uploadManifest(newManifest);
  }
}

export const command = 'upload [options]';

export const describe = 'Upload assets from `release`.';

export const builder = {
  dir: {
    description: 'Project root directory',
    default: process.cwd(),
  },
  version: {
    description: 'Target version',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    default: require(path.join(process.cwd(), 'package.json')).version as string,
  },
  manifest: {
    description:
      'Upload download center manifest update for the target version (NOTE: This will will replace existing version for the channel with the provided one for all existing and newly added assets)',
    default: false,
  },
  ['dry-run']: {
    description:
      'Does everything the real script will do without actually publishing assets to GH / download center',
    default: process.env.npm_config_dry_run === 'true',
  },
};

interface UploadArgv {
  dir: string;
  version: string;
  dryRun: boolean;
  manifest: boolean;
}

export const handler = function handler(argv: UploadArgv): void {
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

  if (!argv.dryRun && process.env.CI && !process.env.EVERGREEN_PROJECT) {
    cli.error('Trying to publish assets from non-Evergreen CI environment');
    return;
  }

  if (!argv.dryRun && process.env.EVERGREEN_PROJECT) {
    const projectChannel = process.env.EVERGREEN_PROJECT.split('-').pop() ?? '';
    if (!['stable', 'testing'].includes(projectChannel)) {
      cli.error(
        `Trying to publish assets from unsupported Evergreen project. Expected stable or testing, got ${projectChannel}`
      );
      return;
    }
    const channelToProjectMap = {
      testing: 'beta',
    } as Record<string, string>;
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
      const attestations = getBuildAttestations(argv.dir, argv.version);
      const attestationsToUpload = attestations.map((attestation) => {
        return {
          name: attestation.uploadKey,
          path: attestation.localPath,
        };
      });
      const assetsToUpload = assets.flatMap((item) => {
        return item.assets;
      });
      return uploadAssetsToDownloadCenter(
        [...assetsToUpload, ...attestationsToUpload],
        channel,
        argv.dryRun
      );
    })
    .catch(abortIfError);
};
