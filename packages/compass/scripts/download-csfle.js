'use strict';
/* eslint-disable no-console */
const os = require('os');
const path = require('path');
const { promises: fs } = require('fs');
const {
  downloadMongoDbWithVersionInfo,
} = require('@mongodb-js/mongodb-downloader');

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
    // TODO(MONGOSH-1833): The current 'continuous' release is not compatible with 8.x rc server releases. So we are using
    // 8.0.0-rc18 (current latest) for now and once 8.0 is released we should switch back to continuous.
    version: '8.0.0-rc18',
  };
  if (process.platform === 'linux') {
    // The CSFLE shared library is built for different distros,
    // but since it only depends on glibc, we can just download
    // a CSFLE library from a distro with a low glibc version
    // such as RHEL8.
    downloadOptions.distro = 'rhel8';
  }

  const { downloadedBinDir, version } = await downloadMongoDbWithVersionInfo(
    CACHE_DIR,
    'continuous',
    downloadOptions
  );
  await fs.mkdir(CSFLE_DIRECTORY, { recursive: true });
  await fs.cp(path.dirname(downloadedBinDir), CSFLE_DIRECTORY, {
    force: true,
    recursive: true,
    preserveTimestamps: true,
  });
  await fs.writeFile(path.join(CSFLE_DIRECTORY, 'version'), version);
})().catch((err) => {
  if (err) {
    console.error(err);
  }

  process.exit(1);
});
