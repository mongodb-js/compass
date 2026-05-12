import download from 'download';
import path from 'path';
import { promises as fs } from 'fs';
import createDebug from 'debug';
import { promisify, inspect } from 'util';
import childProcess from 'child_process';

const debug = createDebug('hadron-build:macos-notarization');
const execFile = promisify(childProcess.execFile);

async function setupMacosNotary(): Promise<void> {
  try {
    await fs.access('macnotary/macnotary');
    debug('macnotary already downloaded');
  } catch {
    debug('downloading macnotary');
    await download(process.env.MACOS_NOTARY_CLIENT_URL as string, 'macnotary', {
      extract: true,
      strip: 1, // remove leading platform + arch directory
    });
    await fs.chmod('macnotary/macnotary', 0o755); // ensure +x is set
  }
}

interface NotarizeOptions {
  bundleId: string;
  macosEntitlements?: string;
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
export async function notarize(
  src: string,
  notarizeOptions: NotarizeOptions
): Promise<void> {
  debug(`Signing and notarizing "${src}"`);

  await setupMacosNotary();

  const fileName = path.basename(src);
  const unsignedArchive = `${fileName}.zip`;
  const signedArchive = `${fileName}.signed.zip`;

  const execOpts = {
    cwd: path.dirname(src),
    encoding: 'utf8' as const,
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
        process.env.REQUESTER === 'github_pr' ? 'sign' : 'notarizeAndSign',
        '-u',
        process.env.MACOS_NOTARY_API_URL as string,
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
