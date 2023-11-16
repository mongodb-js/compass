import { promisify } from 'util';
import childProcess from 'child_process';
import path from 'path';
import createDebug from 'debug';

const execFile = promisify(childProcess.execFile);
const debug = createDebug('compass-build:signtool');

export async function signtool(fileToSign: string) {
  const signtoolPath = path.resolve(__dirname, '..', 'signtool/signtool.exe');

  const execArgs = [
    signtoolPath,
    [path.resolve(fileToSign)],
    { stdio: 'inherit' },
  ];

  debug(`Running signtool.exe to sign '${signtoolPath}'`, {
    execArgs: execArgs,
    env: {
      NOTARY_SIGNING_COMMENT: process.env.NOTARY_SIGNING_COMMENT,
      NOTARY_URL: process.env.NOTARY_URL,
      NOTARY_SIGNING_KEY: process.env.NOTARY_SIGNING_KEY,
    },
  });

  await execFile(signtoolPath, [path.resolve(fileToSign)]);
}
