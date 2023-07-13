/* eslint-disable no-console */
const os = require('os');
const path = require('path');
const { promises: fs } = require('fs');
const { downloadMongoDb } = require('@mongodb-js/mongodb-downloader');

const PACKAGE_ROOT = process.cwd();

// const MONOREPO_ROOT = path.resolve(__dirname, '..');

const CACHE_DIR = path.join(os.tmpdir(), '.compass-csfle-library-cache');

const UPDATE_CACHE = process.argv.includes('--update-cache');

const CSFLE_DIRECTORY = path.resolve(PACKAGE_ROOT, 'src', 'deps', 'csfle');

(async () => {
  const packageJson = require(path.join(PACKAGE_ROOT, 'package.json'));

  if (UPDATE_CACHE) {
    console.log('Re-populating csfle library cache at %s', CACHE_DIR);

    try {
      await fs.rmdir(CACHE_DIR, { recursive: true });
    } catch (e) {
      /* ignore */
    }
  } else {
    console.log('Downloading csfle library for package %s', packageJson.name);
  }

  const downloadOptions = {
    enterprise: true,
    crypt_shared: true,
    version: 'continuous',
  };
  if (process.platform === 'linux') {
    // The CSFLE shared library is built for different distros,
    // but since it only depends on glibc, we can just download
    // a CSFLE library from a distro with a low glibc version
    // such as RHEL7.
    downloadOptions.distro = 'rhel70';
  }

  const downloaded = await downloadMongoDb(
    CACHE_DIR,
    'continuous',
    downloadOptions
  );
  await fs.mkdir(CSFLE_DIRECTORY, { recursive: true });
  await fs.cp(path.dirname(downloaded), CSFLE_DIRECTORY, {
    force: true,
    recursive: true,
    preserveTimestamps: true,
  });
})().catch((err) => {
  if (err) {
    console.error(err);
  }

  process.exit(1);
});
