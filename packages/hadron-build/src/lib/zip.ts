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
  platform?: string;
  outPath?: string;
}

async function zip(
  _opts: ZipOptions,
  done: (err: Error | null, result?: string) => void
): Promise<void> {
  const opts: ZipOptions = Object.assign({}, _opts);
  opts.dir = path.resolve(opts.dir);
  opts.out = path.resolve(opts.out);
  opts.platform = opts.platform || process.platform;

  if (path.extname(opts.out).toLowerCase() === '.zip') {
    opts.outPath = opts.out;
    opts.out = path.dirname(opts.out);
  } else {
    opts.outPath =
      path.resolve(opts.out, path.basename(opts.dir, '.app')) + '.zip';
  }

  const runZip = async (): Promise<void> => {
    if (opts.platform !== 'darwin') {
      await promisify(zipFolder)(opts.dir, opts.outPath as string);
    } else {
      const args = [
        '-V', // Print a line  for every file copied
        '-c', // Create an archive at the destination path
        '-k', // PKZip archive
        '--sequesterRsrc', // Preserve resource forks and HFS meta-data in the subdirectory __MACOSX
        './',
        opts.outPath as string,
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
      const stats = await fs.stat(opts.outPath as string);
      if (!stats.isFile()) {
        throw new Error(
          'Refusing to wipe path "' +
            opts.outPath +
            '" as it is ' +
            (stats.isDirectory() ? 'a directory' : 'not a file')
        );
      }
      await fs.unlink(opts.outPath as string);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err;
      }
    }
  };

  debug('creating zip', opts);

  try {
    await removeZipIfExists();
    await fs.mkdir(opts.out, { recursive: true });
    await runZip();
    done(null, opts.outPath);
  } catch (err) {
    done(err as Error);
  }
}

/**
 * Packages the app as a plain zip for auto-updates.
 *
 * NOTE (imlucas) This should be run after the installers have been
 * created.  The modules that generate the installers also
 * handle signinging the assets. If we zip unsigned assets
 * and publish them for the release, auto updates will be rejected.
 *
 * @param {Target} target
 * @param {Function} done
 * @return {void}
 */
function createApplicationZip(
  target: Target,
  done: (err: Error | null, result?: string) => void
): void {
  if (target.platform === 'linux') {
    debug('.zip releases assets for linux disabled');
    return done(null);
  }
  void zip(createApplicationZip.getOptions(target) as ZipOptions, done);
}

createApplicationZip.getOptions = function (target: Target): ZipOptions | null {
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
};

export default createApplicationZip;
