/**
 * Because of the hadron-build, compass can't have any references to the
 * external resources and as such it gets its own version for download-akzidenz
 * for now just to the build doesn't fail.
 */

/* eslint-disable no-console */
const os = require('os');
const path = require('path');
const { promises: fs, createWriteStream } = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');

const PACKAGE_ROOT = process.cwd();

// const MONOREPO_ROOT = path.resolve(__dirname, '..');

const CACHE_DIR = path.join(os.tmpdir(), '.akzidenz-font-cache');

const fetch = require('make-fetch-happen').defaults({
  cacheManager: CACHE_DIR
});

const AKZIDENZ_CDN_BASE_URL = 'https://d2va9gm4j17fy9.cloudfront.net/fonts/';

const UPDATE_CACHE = process.argv.includes('--update-cache');

const AKZIDENZ_CDN_URLS = [
  'akzidgrostdita.eot',
  'akzidgrostdita.svg',
  'akzidgrostdita.ttf',
  'akzidgrostdita.woff',
  'akzidgrostdlig.eot',
  'akzidgrostdlig.svg',
  'akzidgrostdlig.ttf',
  'akzidgrostdlig.woff',
  'akzidgrostdligcnd.eot',
  'akzidgrostdligcnd.svg',
  'akzidgrostdligcnd.ttf',
  'akzidgrostdligcnd.woff',
  'akzidgrostdligita.eot',
  'akzidgrostdligita.svg',
  'akzidgrostdligita.ttf',
  'akzidgrostdligita.woff',
  'akzidgrostdmed.eot',
  'akzidgrostdmed.svg',
  'akzidgrostdmed.ttf',
  'akzidgrostdmed.woff',
  'akzidgrostdmedita.eot',
  'akzidgrostdmedita.svg',
  'akzidgrostdmedita.ttf',
  'akzidgrostdmedita.woff',
  'akzidgrostdreg.eot',
  'akzidgrostdreg.svg',
  'akzidgrostdreg.ttf',
  'akzidgrostdreg.woff'
].map((filename) => `${AKZIDENZ_CDN_BASE_URL}${filename}`);

const FONTS_DIRECTORY = path.resolve(
  PACKAGE_ROOT,
  'src',
  'app',
  'fonts'
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
};

(async() => {
  const packageJson = require(path.join(PACKAGE_ROOT, 'package.json'));

  if (!UPDATE_CACHE) {
    try {
      await fs.access(FONTS_DIRECTORY);
    } catch (err) {
      // We only want to install the fonts when we are in a project which requires
      // fonts to be present
      console.log(
        'Package %s doesn\'t require fonts to be present, exiting.',
        packageJson.name
      );
      return;
    }
  }

  if (UPDATE_CACHE) {
    console.log('Re-populating akzidenz fonts cache at %s', CACHE_DIR);

    try {
      await fs.rmdir(CACHE_DIR, { recursive: true });
    } catch (e) { /* ignore */ }
  } else {
    console.log(
      'Downloading %d fonts for package %s to %s',
      AKZIDENZ_CDN_URLS.length,
      packageJson.name,
      FONTS_DIRECTORY
    );
  }

  await Promise.all(
    AKZIDENZ_CDN_URLS.map((url) => download(url, FONTS_DIRECTORY))
  );
})().catch((err) => {
  if (err) {
    console.error(err);
  }

  process.exit(1);
});
