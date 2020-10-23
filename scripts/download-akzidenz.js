const path = require('path');
const download = require('download');

const AKZIDENZ_CDN_URLS = [];

const FONTS_DIRECTORY = path.resolve(
  __dirname,
  '..',
  'src',
  'app',
  'fonts'
);

(async() => {
  console.log('Downloading akzidenz fonts.', []);

  await Promise.all(
    AKZIDENZ_CDN_URLS.map(url => download(url, FONTS_DIRECTORY)));
})();

