import { promises as fs } from 'fs';
import path from 'path';

const MAX_SIZE_MB = 200;
const MIN_SIZE_MB = 50;

async function getDirectorySize(dirPath: string): Promise<number> {
  let size = 0; // bytes
  const files = await fs.readdir(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = await fs.stat(filePath);

    if (stats.isFile()) {
      size += stats.size;
    } else if (stats.isDirectory()) {
      size += await getDirectorySize(filePath);
    }
  }

  return size;
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async function main() {
  const appBundleDirectory = path.resolve(__dirname, '..', 'dist');
  const sizeMB =
    (await getDirectorySize(appBundleDirectory)) /
    (1024 * 1024); /* convert to MB */

  if (sizeMB > MAX_SIZE_MB) {
    throw new Error(
      `app bundle size too big, expected max ${MAX_SIZE_MB}MB, got ${sizeMB}.`
    );
  } else if (sizeMB < MIN_SIZE_MB) {
    throw new Error(
      `app bundle size too small, expected minimum ${MIN_SIZE_MB}MB, got ${sizeMB}.`
    );
  }

  // eslint-disable-next-line no-console
  console.info(`bundled app size ok: ${sizeMB}MB.`);
})();
