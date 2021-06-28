/* eslint-disable no-console */
/* eslint-disable no-sync */

const fs = require('fs');
const path = require('path');
const https = require('https');

const downloadUrl = 'https://www.antlr.org/download/antlr-4.7.2-complete.jar';
const outputFile = path.resolve(__dirname, 'antlr-4.7.2-complete.jar');

if (fs.existsSync(outputFile)) {
  console.info(outputFile, 'found, skipping download');
  process.exit(0);
}

console.info('downloading antlr');

https.get(downloadUrl, (response) => response.pipe(fs.createWriteStream(outputFile)));
