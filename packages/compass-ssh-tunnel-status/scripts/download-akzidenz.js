/* eslint-disable no-console */
const path = require('path');
const https = require('https');
const fs = require('fs');
const stream = require('stream');
const util = require('util');
const pipeline = util.promisify(stream.pipeline);

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
  `${AKZIDENZ_CDN_BASE_URL}/akzidgrostdita.eot`,
  `${AKZIDENZ_CDN_BASE_URL}/akzidgrostdita.svg`,
  `${AKZIDENZ_CDN_BASE_URL}/akzidgrostdita.ttf`,
  `${AKZIDENZ_CDN_BASE_URL}/akzidgrostdita.woff`,
  `${AKZIDENZ_CDN_BASE_URL}/akzidgrostdlig.eot`,
  `${AKZIDENZ_CDN_BASE_URL}/akzidgrostdlig.svg`,
  `${AKZIDENZ_CDN_BASE_URL}/akzidgrostdlig.ttf`,
  `${AKZIDENZ_CDN_BASE_URL}/akzidgrostdlig.woff`,
  `${AKZIDENZ_CDN_BASE_URL}/akzidgrostdligcnd.eot`,
  `${AKZIDENZ_CDN_BASE_URL}/akzidgrostdligcnd.svg`,
  `${AKZIDENZ_CDN_BASE_URL}/akzidgrostdligcnd.ttf`,
  `${AKZIDENZ_CDN_BASE_URL}/akzidgrostdligcnd.woff`,
  `${AKZIDENZ_CDN_BASE_URL}/akzidgrostdligita.eot`,
  `${AKZIDENZ_CDN_BASE_URL}/akzidgrostdligita.svg`,
  `${AKZIDENZ_CDN_BASE_URL}/akzidgrostdligita.ttf`,
  `${AKZIDENZ_CDN_BASE_URL}/akzidgrostdligita.woff`,
  `${AKZIDENZ_CDN_BASE_URL}/akzidgrostdmed.eot`,
  `${AKZIDENZ_CDN_BASE_URL}/akzidgrostdmed.svg`,
  `${AKZIDENZ_CDN_BASE_URL}/akzidgrostdmed.ttf`,
  `${AKZIDENZ_CDN_BASE_URL}/akzidgrostdmed.woff`,
  `${AKZIDENZ_CDN_BASE_URL}/akzidgrostdmedita.eot`,
  `${AKZIDENZ_CDN_BASE_URL}/akzidgrostdmedita.svg`,
  `${AKZIDENZ_CDN_BASE_URL}/akzidgrostdmedita.ttf`,
  `${AKZIDENZ_CDN_BASE_URL}/akzidgrostdmedita.woff`,
  `${AKZIDENZ_CDN_BASE_URL}/akzidgrostdreg.eot`,
  `${AKZIDENZ_CDN_BASE_URL}/akzidgrostdreg.svg`,
  `${AKZIDENZ_CDN_BASE_URL}/akzidgrostdreg.ttf`,
  `${AKZIDENZ_CDN_BASE_URL}/akzidgrostdreg.wof`
];

const FONTS_DIRECTORY = path.resolve(
  __dirname,
  '..',
  'src',
  'assets',
  'fonts'
);

(async() => {
  await Promise.all(
    AKZIDENZ_CDN_URLS.map(url => download(url, FONTS_DIRECTORY))
  );
})().catch((err) => {
  if (err) {
    console.error(err);
  }

  process.exit(1);
});
