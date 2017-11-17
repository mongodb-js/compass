import * as fs from 'fs-extra';
import * as gfs from 'graceful-fs';
import * as klaw from 'klaw';

/**
 * Walks over the app directory and returns two arrays of paths,
 * one for files and another one for directories
 *
 * @returns {Promise<{ files: Array<string>, directories: Array<string> }>}
 */
export function getDirectoryStructure(root: string): Promise <{ files: Array<string>, directories: Array<string> }> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(root)) {
      return reject(new Error(`App directory ${root} does not exist`));
    }

    const files: Array<string> = [];
    const directories: Array<string> = [];

    // Why specify fs? Klaw will lazy-load, which doesn't
    // buy us much in a build tool. It does, however, break
    // testing with mock-fs.
    klaw(root, { fs: gfs })
      .on('data', (item) => {
        if (item.stats.isFile()) {
          files.push(item.path)
        } else if (item.stats.isDirectory() && item.path !== root) {
          directories.push(item.path);
        }
      })
      .on('end', () => resolve({ files, directories }));
  });
}
