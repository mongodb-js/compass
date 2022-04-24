import createDebug from 'debug';
import { promises as fs } from 'fs';
import path from 'path';
import download from 'download';
import { execFile as execFileCb } from 'child_process';
import { promisify } from 'util';

const execFile = promisify(execFileCb);

const debug = createDebug('mongodb-compass:compass-build:sign-mac-app');

export async function signMacApp(
  appPath: string,
  options: { bundleId: string; macosEntitlements: string }
): Promise<void> {
  const missingEnvVars = [
    'MACOS_NOTARY_KEY',
    'MACOS_NOTARY_SECRET',
    'MACOS_NOTARY_CLIENT_URL',
    'MACOS_NOTARY_API_URL',
  ].filter((varName) => !process.env[varName]);

  if (missingEnvVars.length) {
    throw new Error(`Missing required env vars: ${missingEnvVars.join(', ')}`);
  }

  const appDirectoryName = path.basename(appPath);

  debug(`Signing and notarizing "${appPath}"`);
  // https://wiki.corp.mongodb.com/display/BUILD/How+to+use+MacOS+notary+service
  debug(
    `Downloading the notary client from ${
      process.env.MACOS_NOTARY_CLIENT_URL || ''
    } to ${path.resolve('macnotary')}`
  );

  await download(process.env.MACOS_NOTARY_CLIENT_URL || '', 'macnotary', {
    extract: true,
    strip: 1, // remove leading platform + arch directory
  });
  await fs.chmod('macnotary/macnotary', 0o755); // ensure +x is set

  debug(`running "zip -y -r '${appDirectoryName}.zip' '${appDirectoryName}'"`);
  await execFile(
    'zip',
    ['-y', '-r', `${appDirectoryName}.zip`, appDirectoryName],
    {
      cwd: path.dirname(appPath),
    }
  );
  debug(`sending file to notary service (bundle id = ${options.bundleId})`);
  const macnotaryResult = await execFile(
    path.resolve('macnotary/macnotary'),
    [
      '-t',
      'app',
      '-m',
      'notarizeAndSign',
      '-u',
      process.env.MACOS_NOTARY_API_URL || '',
      '-b',
      options.bundleId,
      '-f',
      `${appDirectoryName}.zip`,
      '-o',
      `${appDirectoryName}.signed.zip`,
      '--verify',
      ...(options.macosEntitlements ? ['-e', options.macosEntitlements] : []),
    ],
    {
      cwd: path.dirname(appPath),
      encoding: 'utf8',
    }
  );
  debug('macnotary result:', macnotaryResult.stdout, macnotaryResult.stderr);
  debug(
    'ls',
    (
      await execFile('ls', ['-lh'], {
        cwd: path.dirname(appPath),
        encoding: 'utf8',
      })
    ).stdout
  );
  debug('removing existing directory contents');
  await execFile('rm', ['-r', appDirectoryName], {
    cwd: path.dirname(appPath),
  });
  debug(`unzipping with "unzip -u '${appDirectoryName}.signed.zip'"`);
  await execFile('unzip', ['-u', `${appDirectoryName}.signed.zip`], {
    cwd: path.dirname(appPath),
    encoding: 'utf8',
  });
  debug(
    'ls',
    (
      await execFile('ls', ['-lh'], {
        cwd: path.dirname(appPath),
        encoding: 'utf8',
      })
    ).stdout
  );
  debug(
    `removing '${appDirectoryName}.signed.zip' and '${appDirectoryName}.zip'`
  );
  await fs.unlink(`${appPath}.signed.zip`);
  await fs.unlink(`${appPath}.zip`);

  debug('Signing ... %s', appPath);
  await Promise.resolve();
  debug('Successfully signed %s', appPath);
}
