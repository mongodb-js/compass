import createDebug from 'debug';
import { execFileSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import zipFolder from 'zip-folder';
import { promisify } from 'util';
import type Target from './target';

const debug = createDebug('hadron-build:zip');

interface ZipOptions {
  dir: string;
  out: string;
  platform: string;
}

async function zip(_opts: ZipOptions): Promise<string> {
  const opts: ZipOptions = Object.assign({}, _opts);
  opts.dir = path.resolve(opts.dir);
  opts.out = path.resolve(opts.out);

  let outputPath;
  if (path.extname(opts.out).toLowerCase() === '.zip') {
    outputPath = opts.out;
    opts.out = path.dirname(opts.out);
  } else {
    outputPath =
      path.resolve(opts.out, path.basename(opts.dir, '.app')) + '.zip';
  }

  const runZip = async (): Promise<void> => {
    if (opts.platform !== 'darwin') {
      await promisify(zipFolder)(opts.dir, outputPath);
    } else {
      const args = [
        '-V', // Print a line  for every file copied
        '-c', // Create an archive at the destination path
        '-k', // PKZip archive
        '--sequesterRsrc', // Preserve resource forks and HFS meta-data in the subdirectory __MACOSX
        './',
        outputPath,
      ];
      execFileSync('ditto', args, {
        env: process.env,
        cwd: path.join(opts.dir, '..'),
        stdio: 'inherit',
      });
    }
  };

  const removeZipIfExists = async (): Promise<void> => {
    try {
      const stats = await fs.stat(outputPath);
      if (!stats.isFile()) {
        throw new Error(
          'Refusing to wipe path "' +
            outputPath +
            '" as it is ' +
            (stats.isDirectory() ? 'a directory' : 'not a file')
        );
      }
      await fs.unlink(outputPath);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err;
      }
    }
  };

  debug('creating zip', opts);

  await removeZipIfExists();
  await fs.mkdir(opts.out, { recursive: true });
  await runZip();
  return outputPath;
}

function getZipOptionsFromTarget(target: Target): ZipOptions | null {
  const asset = target.getAssetWithExtension('.zip');
  if (!asset) {
    debug('no asset w extension .zip!');
    return null;
  }

  const res: ZipOptions = {
    dir: target.appPath,
    out: asset.path,
    platform: target.platform,
  };

  debug('options', res);
  return res;
}

/**
 * Packages the app as a plain zip for auto-updates.
 *
 * NOTE (imlucas) This should be run after the installers have been
 * created.  The modules that generate the installers also
 * handle signinging the assets. If we zip unsigned assets
 * and publish them for the release, auto updates will be rejected.
 *
 */
async function createApplicationZip(target: Target): Promise<void> {
  if (target.platform === 'linux') {
    debug('.zip releases assets for linux disabled');
    return;
  }
  const options = getZipOptionsFromTarget(target);
  if (!options) {
    debug('no options for zip, skipping');
    return;
  }
  await zip(options);
}

export default createApplicationZip;
