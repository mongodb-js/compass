'use strict';
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const debug = require('debug')('hadron-build:target');
const { sign: _garasign } = require('@mongodb-js/signing-utils');

const canSign = () =>
  process.env.GARASIGN_USERNAME &&
  process.env.GARASIGN_PASSWORD &&
  process.env.ARTIFACTORY_USERNAME &&
  process.env.ARTIFACTORY_PASSWORD;

/**
 * When using gpg to sign a file, it creates a signature file
 * with same name as the original file and adds `.sig` to it.
 *
 * @param {string} filename
 * @returns string
 */
function getSignedFilename(filename) {
  return `${filename}.sig`;
}

/**
 * Currently, windows and macos zip are created from `zip` step
 * of the release process and we sign them here. For linux, we
 * create and sign the archive when creating corresponding deb/rpm file.
 *
 * @param {import('./Target')} target
 */
function signArchive(target, cb) {
  const { app_archive_name, platform } = target;
  if (platform === 'linux') {
    debug('linux archive is signed when creating deb/rpm');
    return cb();
  }
  sign(target.dest(app_archive_name)).then(cb).catch(cb);
}

/**
 * @param {string} src
 */
function getSigningMethod(src) {
  switch (path.extname(src)) {
    case '.exe':
    case '.msi':
      return 'jsign';
    case '.rpm':
      return 'rpm_gpg';
    default:
      return 'gpg';
  }
}

function hashFile(filename) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const fh = fs.createReadStream(filename);

    fh.on('data', d => hash.update(d));
    fh.on('end', () => {
        const digest = hash.digest('hex');
        resolve(digest);
    });
    fh.on('error', reject);
  });
}

/**
 * We are signing the file using `gpg` or `jsign` depending on the
 * file extension. If the extension is `.exe` or `.msi`, we use `jsign`
 * otherwise we use `gpg`.
 *
 * @param {string} src
 * @returns {Promise<void>}
 */
async function sign(src, garasign = _garasign) {
  debug('Signing %s ...', src);

  if (!canSign()) {
    debug('Skipping signing. Missing credentials.');
    return;
  }

  const clientOptions = {
    client: 'remote',
    host: process.env.SIGNING_SERVER_HOSTNAME,
    username: process.env.SIGNING_SERVER_USERNAME,
    port: process.env.SIGNING_SERVER_PORT,
    privateKey: process.env.SIGNING_SERVER_PRIVATE_KEY,
    signingMethod: getSigningMethod(src),
  };

  debug(`checksum of ${src} before signing: ${await hashFile(src)}`);
  await garasign(src, clientOptions);
  debug(`checksum of ${src} after signing: ${await hashFile(src)}`);
}

module.exports = { sign, signArchive, getSignedFilename };
