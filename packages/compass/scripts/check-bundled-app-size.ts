import fs from 'fs';
import path from 'path';

const MAX_SIZE_MB = 200;
const MIN_SIZE_MB = 50;

(async function main() {
  const appBundleDirectory = path.resolve(__dirname, '..', 'dist');
  const sizeMB =
    (await fs.statSync(appBundleDirectory)).size /
    (1024 * 1024); /* convert to MB */

  if (sizeMB > MAX_SIZE_MB) {
    throw new Error(
      `app bundle size too big, expected max ${MAX_SIZE_MB}MB, got ${sizeMB}.`
    );
  } else if (sizeMB < MAX_SIZE_MB) {
    throw new Error(
      `app bundle size too small, expected minimum ${MIN_SIZE_MB}MB, got ${sizeMB}.`
    );
  }

  console.info(`bundled app size ok: ${sizeMB}MB.`);
})();
