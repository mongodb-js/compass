const download = require('download');
const path = require('path');
const { promises: fs } = require('fs');
const debug = require('debug')('hadron-build:target');
const { promisify } = require('util');
const childProcess = require('child_process');
const execFile = promisify(childProcess.execFile);

async function setupMacosNotary() {
  try {
    await fs.access('macnotary/macnotary');
  } catch (err) {
    await download(process.env.MACOS_NOTARY_CLIENT_URL, 'macnotary', {
      extract: true,
      strip: 1 // remove leading platform + arch directory
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

  // Step:1 - zip up the file/folder to unsignedArchive
  debug(`running "zip -y -r '${unsignedArchive}' '${fileName}'"`);
  await execFile('zip', ['-y', '-r', unsignedArchive, fileName], {
    cwd: path.dirname(src)
  });

  // Step:2 - send the zip to notary service and save the result to signedArchive
  debug(`sending file to notary service (bundle id = ${notarizeOptions.bundleId})`);
  const macnotaryResult = await execFile(path.resolve('macnotary/macnotary'), [
    '-t', 'app',
    '-m', 'notarizeAndSign',
    '-u', process.env.MACOS_NOTARY_API_URL,
    '-b', notarizeOptions.bundleId,
    '-f', unsignedArchive,
    '-o', signedArchive,
    '--verify',
    ...(notarizeOptions.macosEntitlements ? ['-e', notarizeOptions.macosEntitlements] : [])
  ], {
    cwd: path.dirname(src),
    encoding: 'utf8'
  });
  debug('macnotary result:', macnotaryResult.stdout, macnotaryResult.stderr);
  debug('ls', (await execFile('ls', ['-lh'], { cwd: path.dirname(src), encoding: 'utf8' })).stdout);

  // Step:3 - clean up. remove existing src, unzip signedArchive to src, remove signedArchive and unsignedArchive
  debug('removing existing directory contents');
  await execFile('rm', ['-r', fileName], {
    cwd: path.dirname(src)
  });
  debug(`unzipping with "unzip -u ${signedArchive}"`);
  await execFile('unzip', ['-u', signedArchive], {
    cwd: path.dirname(src),
    encoding: 'utf8'
  });
  debug('ls', (await execFile('ls', ['-lh'], { cwd: path.dirname(src), encoding: 'utf8' })).stdout);
  debug(`removing ${signedArchive} and ${unsignedArchive}`);
  await execFile('rm', ['-r', signedArchive, unsignedArchive], {
    cwd: path.dirname(src)
  });
}

module.exports = { notarize };
