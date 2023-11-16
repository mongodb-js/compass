/* eslint-disable no-console */
import path from 'path';
import { Target } from '../lib/target';
import { downloadAssetFromEvergreen } from '../lib/download-center';
import { getMonorepoRoot } from '../lib/monorepo';
import type { ArgumentsCamelCase, CommandModule } from 'yargs';

const root = getMonorepoRoot();

async function handler(
  argv: ArgumentsCamelCase<{ dir?: string; version?: string }>
) {
  const dir = argv.dir ?? process.cwd();

  const rawVersion: string =
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    argv.version ?? require(path.join(dir, 'package.json')).version;

  if (!rawVersion) {
    throw new Error(
      'a version is required either as argument or in package.json'
    );
  }

  const version = rawVersion.replace(/^v/, '');
  const assets = Target.getAssetsForVersion(dir, version);

  const assetsToDownload = assets.flatMap(({ assets }) => {
    return assets;
  });

  const downloads = assetsToDownload.map(async (asset) => {
    const shortPath = path.relative(root, asset.path);
    console.info(
      `${asset.name}: download from evg bucket started (path: ${shortPath})`
    );
    await downloadAssetFromEvergreen(asset);
    console.info(`${asset.name}: download from evg bucket complete`);
  });

  await Promise.all(downloads);
}

export default {
  command: 'download [options]',
  describe: 'Download all `release` assets from evergreen bucket',
  builder: {
    dir: {
      description: 'Project root directory',
      default: process.cwd(),
    },
    version: {
      description: 'Target version',
    },
  },
  handler,
} as CommandModule;
