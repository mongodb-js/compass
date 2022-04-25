const download = require('download');
const fs = require('fs');
const debug = require('debug')('hadron-build:signtool');
const childProcess = require('child_process');
const path = require('path');

async function signtool(fileToSign) {
  if (!process.env.NOTARY_URL ||
    !process.env.NOTARY_SIGNING_KEY ||
    !process.env.NOTARY_AUTH_TOKEN) {
    const missingVars = [
      'NOTARY_URL',
      'NOTARY_SIGNING_KEY',
      'NOTARY_AUTH_TOKEN',
    ].filter((varName) => !process.env[varName]);
    throw new Error(`Missing required env vars: ${missingVars.join(', ')}`);
  }

  if (!fs.existsSync(fileToSign)) {
    throw new Error(`Signtool aborted: ${fileToSign} not found.`);
  }

  const signtoolUrl = 'https://s3.amazonaws.com/boxes.10gen.com/build/signtool.exe';
  const signtoolPath = path.resolve('signtool.exe');

  // eslint-disable-next-line no-sync
  if (!fs.existsSync(signtoolPath)) {
    debug(`Downloading signtool.exe from ${signtoolUrl} to ${signtoolPath}`);
    await download(signtoolUrl, 'signtool.exe', {
      extract: true,
      strip: 1 // remove leading platform + arch directory
    });
  }

  debug(`Running signtool.exe to sign '${signtoolPath}'`);

  // eslint-disable-next-line no-sync
  const {status} = childProcess.spawnSync('signtool.exe', ['yes', path.resolve(fileToSign)], { stdio: 'inherit' });

  if (status !== 0) {
    throw new Error('Signature failed: signtool.exe exited with non-zero exit code.');
  }
}

module.exports = { signtool };
