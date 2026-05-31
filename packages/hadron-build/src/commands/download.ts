import path from 'path';
import Target from '../lib/target';
import { downloadAssetFromEvergreen } from '../lib/download-center';
import { getBuildAttestations } from '../lib/build-attestations';
import createCLI from 'mongodb-js-cli';
import type { Argv, CommandModule } from 'yargs';
import type { BuilderCallbackParsedArgs } from './utils';

const cli = createCLI('hadron-build:download');
const root = path.resolve(__dirname, '..', '..', '..');

type DownloadArgv = BuilderCallbackParsedArgs<
  typeof buildDownloadCommandOptions
>;
function buildDownloadCommandOptions(yargs: Argv) {
  return yargs.options({
    dir: {
      description: 'Project root directory',
      default: process.cwd(),
    },
    version: {
      description: 'Target version',
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      default: require(path.join(process.cwd(), 'package.json'))
        .version as string,
    },
  });
}

const handler = async (argv: DownloadArgv): Promise<void> => {
  argv.version = argv.version.replace(/^v/, '');

  const assets = Target.getAssetsForVersion(argv.dir, argv.version);

  const assetsToDownload = assets.flatMap(({ assets }) => {
    return assets;
  });
  const attestations = getBuildAttestations(argv.dir, argv.version);
  const attestationsToDownload = attestations.map((attestation) => {
    return {
      name: attestation.downloadKey,
      path: attestation.localPath,
    };
  });
  const downloads = [...assetsToDownload, ...attestationsToDownload].map(
    async (asset) => {
      const shortPath = path.relative(root, asset.path);
      cli.info(
        `${asset.name}: download from evg bucket started (path: ${shortPath})`
      );
      await downloadAssetFromEvergreen(asset);
      cli.info(`${asset.name}: download from evg bucket complete`);
    }
  );

  return Promise.all(downloads).then(() => undefined);
};

export const downloadCommand: CommandModule<unknown, DownloadArgv> = {
  command: 'download [options]',
  describe: 'Download all `release` assets from evergreen bucket',
  builder: buildDownloadCommandOptions,
  handler,
};
