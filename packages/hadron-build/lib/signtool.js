// const download = require('download');
const fs = require('fs');
const debug = require('debug')('hadron-build:signtool');
const { execFileSync } = require('child_process');
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

  const signtoolPath = path.resolve(__dirname, '..', 'signtool/signtool.exe');

  const execArgs = [signtoolPath, [path.resolve(fileToSign)], { stdio: 'inherit' }];
  debug(`Running signtool.exe to sign '${signtoolPath}'`, {
    execaArgs: execArgs,
    env: {
      NOTARY_SIGNING_COMMENT: process.env.NOTARY_SIGNING_COMMENT,
      NOTARY_URL: process.env.NOTARY_URL,
      NOTARY_SIGNING_KEY: process.env.NOTARY_SIGNING_KEY,
    }
  });

  // eslint-disable-next-line no-sync
  await execFileSync(...execArgs);
}

module.exports = { signtool };
