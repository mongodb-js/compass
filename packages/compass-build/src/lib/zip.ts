import { execFile as execFileCb } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import createDebug from 'debug';
import path from 'path';
import type { Target } from './target';

const execFile = promisify(execFileCb);
const debug = createDebug('hadron-build:zip');

async function removeFileIfExists(filePath: string) {
  try {
    const stats = await fs.stat(filePath);

    if (stats.isFile()) {
      await fs.unlink(filePath);
    } else {
      throw new Error('attempt to remove something that is not a file');
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Create a ZIP archive.
 */
async function zipFolder(
  srcDir: string,
  outFile: string,
  options: { includeRootAsEntry: boolean }
): Promise<void> {
  // Let's assume that either zip or 7z are installed. That's true for the
  // evergreen macOS and Windows machines, respectively, at this point.
  // In either case, using these has the advantage of preserving executable permissions
  // as opposed to using libraries like adm-zip.
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await removeFileIfExists(outFile);

  const parentDir = options.includeRootAsEntry ? path.dirname(srcDir) : srcDir;
  const srcDirName = options.includeRootAsEntry ? path.basename(srcDir) : '.';

  try {
    await execFile('zip', ['-r', outFile, srcDirName], { cwd: parentDir });
  } catch (err: any) {
    if (err?.code === 'ENOENT') {
      await execFile('7z', ['a', outFile, srcDirName], { cwd: parentDir });
    } else {
      throw err;
    }
  }
}

export async function createZipPackage(target: Target) {
  if (target.platform === 'linux') {
    debug('.zip releases assets for linux disabled');
    return;
  }

  const asset = target.getAssetWithExtension('.zip');

  if (!asset) {
    throw new Error('no asset with extension .zip!');
  }

  if (target.platform === 'darwin') {
    // on other platforms we zip only the folder content. Here we include the folder as
    // an entry cause the folder is the .app file, if we just zip the content the
    // bundle won't be very useful.
    return await zipFolder(target.appPath, asset.path, {
      includeRootAsEntry: true,
    });
  }

  await zipFolder(target.appPath, asset.path, { includeRootAsEntry: false });
}
