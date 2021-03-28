const path = require('path');
const download = require('download');

const AKZIDENZ_CDN_URLS = [
  'https://d2va9gm4j17fy9.cloudfront.net/fonts/akzidgrostdita.eot',
  'https://d2va9gm4j17fy9.cloudfront.net/fonts/akzidgrostdita.svg',
  'https://d2va9gm4j17fy9.cloudfront.net/fonts/akzidgrostdita.ttf',
  'https://d2va9gm4j17fy9.cloudfront.net/fonts/akzidgrostdita.woff',
  'https://d2va9gm4j17fy9.cloudfront.net/fonts/akzidgrostdlig.eot',
  'https://d2va9gm4j17fy9.cloudfront.net/fonts/akzidgrostdlig.svg',
  'https://d2va9gm4j17fy9.cloudfront.net/fonts/akzidgrostdlig.ttf',
  'https://d2va9gm4j17fy9.cloudfront.net/fonts/akzidgrostdlig.woff',
  'https://d2va9gm4j17fy9.cloudfront.net/fonts/akzidgrostdligcnd.eot',
  'https://d2va9gm4j17fy9.cloudfront.net/fonts/akzidgrostdligcnd.svg',
  'https://d2va9gm4j17fy9.cloudfront.net/fonts/akzidgrostdligcnd.ttf',
  'https://d2va9gm4j17fy9.cloudfront.net/fonts/akzidgrostdligcnd.woff',
  'https://d2va9gm4j17fy9.cloudfront.net/fonts/akzidgrostdligita.eot',
  'https://d2va9gm4j17fy9.cloudfront.net/fonts/akzidgrostdligita.svg',
  'https://d2va9gm4j17fy9.cloudfront.net/fonts/akzidgrostdligita.ttf',
  'https://d2va9gm4j17fy9.cloudfront.net/fonts/akzidgrostdligita.woff',
  'https://d2va9gm4j17fy9.cloudfront.net/fonts/akzidgrostdmed.eot',
  'https://d2va9gm4j17fy9.cloudfront.net/fonts/akzidgrostdmed.svg',
  'https://d2va9gm4j17fy9.cloudfront.net/fonts/akzidgrostdmed.ttf',
  'https://d2va9gm4j17fy9.cloudfront.net/fonts/akzidgrostdmed.woff',
  'https://d2va9gm4j17fy9.cloudfront.net/fonts/akzidgrostdmedita.eot',
  'https://d2va9gm4j17fy9.cloudfront.net/fonts/akzidgrostdmedita.svg',
  'https://d2va9gm4j17fy9.cloudfront.net/fonts/akzidgrostdmedita.ttf',
  'https://d2va9gm4j17fy9.cloudfront.net/fonts/akzidgrostdmedita.woff',
  'https://d2va9gm4j17fy9.cloudfront.net/fonts/akzidgrostdreg.eot',
  'https://d2va9gm4j17fy9.cloudfront.net/fonts/akzidgrostdreg.svg',
  'https://d2va9gm4j17fy9.cloudfront.net/fonts/akzidgrostdreg.ttf',
  'https://d2va9gm4j17fy9.cloudfront.net/fonts/akzidgrostdreg.woff'
];

const FONTS_DIRECTORY = path.resolve(
  __dirname,
  '..',
  'src',
  'app',
  'fonts'
);

(async() => {
  console.log('Downloading akzidenz fonts.', AKZIDENZ_CDN_URLS);

  await Promise.all(
    AKZIDENZ_CDN_URLS.map(url => download(url, FONTS_DIRECTORY)));
})();
