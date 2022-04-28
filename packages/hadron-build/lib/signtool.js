const debug = require('debug')('hadron-build:signtool');
const { execFileSync } = require('child_process');
const path = require('path');

async function signtool(fileToSign) {
  const signtoolPath = path.resolve(__dirname, '..', 'signtool/signtool.exe');

  const execArgs = [signtoolPath, [path.resolve(fileToSign)], { stdio: 'inherit' }];
  debug(`Running signtool.exe to sign '${signtoolPath}'`, {
    execArgs: execArgs,
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
