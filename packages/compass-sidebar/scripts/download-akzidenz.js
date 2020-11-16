/* eslint-disable no-console */
const path = require('path');
const https = require('https');
const fs = require('fs');
const stream = require('stream');
const util = require('util');
const pipeline = util.promisify(stream.pipeline);
const fsAccess = util.promisify(fs.access);

const download = (url, destDir) => {
  const destFileName = path.join(destDir, path.basename(url));
  const destFile = fs.createWriteStream(destFileName);
  console.log('Downloading', url, 'to', path.relative(process.cwd(), destFileName));

  return new Promise((resolve) => {
    https.get(url, (response) => {
      resolve(pipeline(response, destFile));
    });
  });
};

const AKZIDENZ_CDN_BASE_URL = 'https://d2va9gm4j17fy9.cloudfront.net/fonts/';
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
  __dirname,
  '..',
  'src',
  'assets',
  'fonts'
);

(async() => {
  try {
    await fsAccess(FONTS_DIRECTORY);
  } catch (err) {
    // We only want to install the fonts when we are in a project which is.
    return;
  }

  await Promise.all(
    AKZIDENZ_CDN_URLS.map(url => download(url, FONTS_DIRECTORY))
  );
})().catch((err) => {
  if (err) {
    console.error(err);
  }

  process.exit(1);
});
