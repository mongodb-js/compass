import path from 'path';
import createDebug from 'debug';
import { sign as _garasign } from '@mongodb-js/signing-utils';
import type Target from './target';

type SigningMethod = Parameters<typeof _garasign>[1]['signingMethod'];

const debug = createDebug('hadron-build:target');

function canSign(): boolean {
  return !!(
    process.env.GARASIGN_USERNAME &&
    process.env.GARASIGN_PASSWORD &&
    process.env.ARTIFACTORY_USERNAME &&
    process.env.ARTIFACTORY_PASSWORD
  );
}

/**
 * When using gpg to sign a file, it creates a signature file
 * with same name as the original file and adds `.sig` to it.
 */
export function getSignedFilename(filename: string): string {
  return `${filename}.sig`;
}

/**
 * Currently, windows and macos zip are created from `zip` step
 * of the release process and we sign them here. For linux, we
 * create and sign the archive when creating corresponding deb/rpm file.
 */
export async function signArchive(target: Target): Promise<void> {
  const { app_archive_name, platform } = target;
  if (platform === 'linux') {
    debug('linux archive is signed when creating deb/rpm');
    return;
  }
  await sign(target.dest(app_archive_name));
}

function getSigningMethod(src: string): SigningMethod {
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

/**
 * We are signing the file using `gpg` or `jsign` depending on the
 * file extension. If the extension is `.exe` or `.msi`, we use `jsign`
 * otherwise we use `gpg`.
 */
export async function sign(
  src: string,
  garasign: typeof _garasign = _garasign
): Promise<void> {
  debug('Signing %s ...', src);

  if (!canSign()) {
    debug('Skipping signing. Missing credentials.');
    return;
  }

  const clientOptions = {
    client: 'remote' as const,
    host: process.env.SIGNING_SERVER_HOSTNAME,
    username: process.env.SIGNING_SERVER_USERNAME,
    port: process.env.SIGNING_SERVER_PORT
      ? parseInt(process.env.SIGNING_SERVER_PORT, 10)
      : undefined,
    privateKey: process.env.SIGNING_SERVER_PRIVATE_KEY,
    signingMethod: getSigningMethod(src),
  };

  await garasign(src, clientOptions);
}
