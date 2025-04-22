// eslint-disable-next-line strict
'use strict';
const download = require('download');
const path = require('path');
const { promises: fs } = require('fs');
const debug = require('debug')('hadron-build:macos-notarization');
const { promisify, inspect } = require('util');
const childProcess = require('child_process');
const execFile = promisify(childProcess.execFile);

async function setupMacosNotary() {
  try {
    await fs.access('macnotary/macnotary');
    debug('macnotary already downloaded');
  } catch (err) {
    debug('downloading macnotary');
    await download(process.env.MACOS_NOTARY_CLIENT_URL, 'macnotary', {
      extract: true,
      strip: 1, // remove leading platform + arch directory
    });
    await fs.chmod('macnotary/macnotary', 0o755); // ensure +x is set
  }
}

/**
 * Notarize a resource with the macOS notary service.
 * https://wiki.corp.mongodb.com/display/BUILD/How+to+use+MacOS+notary+service
 *
 * Notarization is a three step process:
 * 1. All the files to be notarized are zipped up into a single file.
 * 2. The zip file is uploaded to the notary service. It signs all the
 *   files in the zip file and returns a new zip file with the signed files.
 * 3. The orginal files are removed and the signed files are unzipped into
 *  their place.
 *
 * @param {string} src The path to the resource to notarize. It can be a directory or a file.
 * @param {object} notarizeOptions
 * @param {string} notarizeOptions.bundleId
 * @param {string} [notarizeOptions.macosEntitlements]
 */
async function notarize(src, notarizeOptions) {
  debug(`Signing and notarizing "${src}"`);

  await setupMacosNotary();

  const fileName = path.basename(src);
  const unsignedArchive = `${fileName}.zip`;
  const signedArchive = `${fileName}.signed.zip`;

  const execOpts = {
    cwd: path.dirname(src),
    encoding: 'utf8',
  };

  // Step:1 - zip up the file/folder to unsignedArchive
  debug(`running "zip -y -r '${unsignedArchive}' '${fileName}'"`);
  await execFile('zip', ['-y', '-r', unsignedArchive, fileName], execOpts);

  try {
    // Step:2 - send the zip to notary service and save the result to signedArchive
    debug(
      `sending file to notary service (bundle id = ${notarizeOptions.bundleId})`
    );
    const macnotaryResult = await execFile(
      path.resolve('macnotary/macnotary'),
      [
        '-t',
        'app',
        '-m',
        process.env.DEV_VERSION_IDENTIFIER ? 'sign' : 'notarizeAndSign',
        '-u',
        process.env.MACOS_NOTARY_API_URL,
        '-b',
        notarizeOptions.bundleId,
        '-f',
        unsignedArchive,
        '-o',
        signedArchive,
        '--verify',
        ...(notarizeOptions.macosEntitlements
          ? ['-e', notarizeOptions.macosEntitlements]
          : []),
      ],
      execOpts
    );
    debug('macnotary result:', macnotaryResult.stdout, macnotaryResult.stderr);
    debug('ls', (await execFile('ls', ['-lh'], execOpts)).stdout);

    // Step:3 - remove existing src, unzip signedArchive to src
    debug('removing existing directory contents');
    await execFile('rm', ['-r', fileName], execOpts);
    debug(`unzipping with "unzip -u ${signedArchive}"`);
    await execFile('unzip', ['-u', signedArchive], execOpts);
  } catch (err) {
    debug(
      'full macnotary error output',
      inspect(err, {
        maxArrayLength: Infinity,
        maxStringLength: Infinity,
      })
    );
    throw err;
  } finally {
    // cleanup - remove signedArchive and unsignedArchive
    debug('ls', (await execFile('ls', ['-lh'], execOpts)).stdout);
    debug(`removing ${signedArchive} and ${unsignedArchive}`);
    await execFile(
      'rm',
      ['-r', signedArchive, unsignedArchive],
      execOpts
    ).catch((err) => {
      debug('error cleaning up', err);
    });
  }
}

module.exports = { notarize };
