const path = require('path');
const debug = require('debug')('hadron-build:target');
const { sign: _garasign } = require('@mongodb-js/signing-utils');

const canSign = () => (
  process.env.GARASIGN_USERNAME &&
  process.env.GARASIGN_PASSWORD &&
  process.env.ARTIFACTORY_USERNAME &&
  process.env.ARTIFACTORY_PASSWORD
);

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
 * of the release process. For linux, we create the archive when
 * creating corresponding deb/rpm file. And here, we sign all of
 * them togther.
 *
 * @param {import('./Target')} target
 */
function signArchive(target, cb) {
  const { app_archive_name, platform } = target;
  if (platform === 'linux') {
    debug('Skipping archive signing for %s', platform);
    return cb();
  }
  const file = target.dest(app_archive_name);
  debug('Signing archive %s', file);
  sign(file).then(cb).catch(cb);
}

/**
 *
 * For signing a file, we have following options with the current CI setup:
 *
 * |----------|--------|--------|----------------|--------------|
 * | platform | docker | client | signing method | filetype     |
 * |----------|--------|--------|----------------|--------------|
 * | macOS    | no     | remote | gpg            | zip          |
 * | ubuntu   | yes    | local  | gpg            | zip, deb     |
 * | rhel     | yes †  | remote | gpg            | zip, rpm     |
 * | windows  | no     | remote | jsign          | msi, exe     |
 * | windows  | no     | remote | gpg            | zip, nupkg   |
 * |----------|--------|--------|----------------|--------------|
 *
 * † On rhel we have docker, but currently we are using rhel7.6
 *  for packaging and docker does not support login using --password-stdin
 *
 * @param {string} src
 * @returns {Promise<void>}
 */
async function sign(src, garasign = _garasign) {
  const variant = process.env.EVERGREEN_BUILD_VARIANT;
  debug('Signing on %s ... %s', variant, src);

  if (!canSign()) {
    debug('Skipping signing. Missing credentials.');
    return;
  }

  const remoteServerOptions = {
    host: process.env.SIGNING_SERVER_HOSTNAME,
    username: process.env.SIGNING_SERVER_USERNAME,
    port: process.env.SIGNING_SERVER_PORT,
    privateKey: process.env.SIGNING_SERVER_PRIVATE_KEY,
  };

  if (variant === 'ubuntu') {
    debug('Signing options', { client: 'local', signingMethod: 'gpg' });
    return await garasign(src, {
      client: 'local',
      signingMethod: 'gpg',
    });
  }

  if (
    variant === 'windows' &&
    (path.extname(src) === '.exe' || path.extname(src) === '.msi')
  ) {
    debug('Signing options', { client: 'remote', signingMethod: 'jsign' });
    return await garasign(src, {
      ...remoteServerOptions,
      client: 'remote',
      signingMethod: 'jsign',
    });
  }

  debug('Signing options', { client: 'remote', signingMethod: 'gpg' });
  return await garasign(src, {
    ...remoteServerOptions,
    client: 'remote',
    signingMethod: 'gpg',
  });
}

module.exports = { sign, signArchive, getSignedFilename };
