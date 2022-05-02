import { execFileSync } from 'child_process';
import path from 'path';

import createDebug from 'debug';
const debug = createDebug('mongodb-compass:compass-build:sign-windows-package');

export function signWindowsPackage(fileToSign: string): void {
  const fileToSignAbsPath = path.resolve(fileToSign);
  debug('Signing ... %s', fileToSignAbsPath);

  const signtoolPath = path.resolve(
    __dirname,
    '../../../signtool/signtool.exe'
  );

  debug(`Running ${signtoolPath} to sign '${fileToSignAbsPath}'`, {
    env: {
      NOTARY_SIGNING_COMMENT: process.env.NOTARY_SIGNING_COMMENT,
      NOTARY_URL: process.env.NOTARY_URL,
      NOTARY_SIGNING_KEY: process.env.NOTARY_SIGNING_KEY,
    },
  });

  // eslint-disable-next-line no-sync
  execFileSync(signtoolPath, [fileToSignAbsPath], { stdio: 'inherit' });
  debug('Successfully signed %s', fileToSignAbsPath);
}
