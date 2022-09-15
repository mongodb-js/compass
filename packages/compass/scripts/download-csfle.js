/* eslint-disable no-console */
const os = require('os');
const path = require('path');
const { promises: fs, createWriteStream, createReadStream } = require('fs');
const { getDownloadURL } = require('mongodb-download-url');
const { pipeline } = require('stream');
const { promisify } = require('util');
const decompress = require('decompress');
const tar = require('tar');

const PACKAGE_ROOT = process.cwd();

// const MONOREPO_ROOT = path.resolve(__dirname, '..');

const CACHE_DIR = path.join(os.tmpdir(), '.compass-csfle-library-cache');

const fetch = require('make-fetch-happen').defaults({
  cacheManager: CACHE_DIR
});

const UPDATE_CACHE = process.argv.includes('--update-cache');

const CSFLE_DIRECTORY = path.resolve(
  PACKAGE_ROOT,
  'src',
  'deps',
  'csfle'
);

const download = async(url, destDir) => {
  const destFileName = path.basename(url);
  const destFilePath = path.join(destDir, destFileName);

  const res = await fetch(url);

  // If cache item stored by `make-fetch-happen` is stale, it will check if
  // resource was not modified with the remote and can return a 304 with a body
  // present. In that case we don't want to throw an error, but rather proceed
  // with the normal flow
  if (!res.ok && res.status !== 304) {
    throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
  }

  if (!UPDATE_CACHE) {
    await promisify(pipeline)(res.body, createWriteStream(destFilePath));
  }

  return destFilePath;
};

(async() => {
  const packageJson = require(path.join(PACKAGE_ROOT, 'package.json'));

  if (UPDATE_CACHE) {
    console.log('Re-populating csfle library cache at %s', CACHE_DIR);

    try {
      await fs.rmdir(CACHE_DIR, { recursive: true });
    } catch (e) { /* ignore */ }
  } else {
    console.log(
      'Downloading csfle library for package %s',
      packageJson.name
    );
  }

  const downloadOptions = {
    enterprise: true,
    crypt_shared: true
  };
  if (process.platform === 'linux') {
    // The CSFLE shared library is built for different distros,
    // but since it only depends on glibc, we can just download
    // a CSFLE library from a distro with a low glibc version
    // such as RHEL7.
    downloadOptions.distro = 'rhel70';
  }
  let artifactInfo;
  // Try getting the latest stable csfle library, if none exists
  // (which is the case at the time of writing), fall back to
  // a 6.0 rc candidate. We can remove this try/catch after 6.0.0.
  try {
    artifactInfo = await getDownloadURL(downloadOptions);
  } catch {
    artifactInfo = await getDownloadURL({
      ...downloadOptions,
      version: '>= 6.0.0'
    });
  }

  console.log('Downloading csfle artifact', artifactInfo, 'to', CSFLE_DIRECTORY);
  await fs.mkdir(CSFLE_DIRECTORY, { recursive: true });
  const artifactPath = await download(artifactInfo.url, CSFLE_DIRECTORY);

  if (artifactInfo.ext === 'zip') {
    // For .zip files, use `decompress`
    await decompress(artifactPath, CSFLE_DIRECTORY);
  } else {
    // For .tar files, `decompress` is buggy, so we use `tar` instead
    await promisify(pipeline)(
      createReadStream(artifactPath),
      tar.x({
        C: CSFLE_DIRECTORY
      }));
  }
})().catch((err) => {
  if (err) {
    console.error(err);
  }

  process.exit(1);
});
