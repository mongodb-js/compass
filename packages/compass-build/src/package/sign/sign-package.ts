import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import type {
  SpawnSyncOptionsWithStringEncoding,
  SpawnSyncReturns,
} from 'child_process';
import * as spawn from 'cross-spawn';
import createDebug from 'debug';

const debug = createDebug('mongodb-compass:compass-build:sign-package');

export interface NotarizeOptions {
  signingKeyName: string;
  authToken: string;
  signingComment: string;
  serverUrl: string;
  clientPath: string;
  pythonExecutable: string;
}

function generateComment(file: string): string {
  let comment =
    process.env.NOTARY_SIGNING_COMMENT || `Signing ${path.basename(file)}`;

  if (process.env.EVERGREEN) {
    const project = process.env.EVERGREEN_PROJECT || '';
    const variant = process.env.EVERGREEN_BUILD_VARIANT || '';
    const revision = process.env.EVERGREEN_REVISION || '';
    const branch = process.env.EVERGREEN_BRANCH_NAME || '';

    comment += ` | Evergreen project ${project} ${revision} - ${variant} - ${branch}`;
  } else {
    comment += ' | Signing outside CI';
  }

  return comment;
}

/**
 * Client for the [notary-service](https://github.com/10gen/notary-service).
 *
 * Parameters for the notary service are passed in as environment variables:
 *
 *  - `NOTARY_SIGNING_KEY` The name of the key to use for signing
 *  - `NOTARY_SIGNING_COMMENT` The comment to enter into the notary log for this signing operation
 *  - `NOTARY_AUTH_TOKEN` The password for using the selected signing key
 *  - `NOTARY_URL` The URL of the notary service
 */
export async function signPackage(file: string): Promise<void> {
  const signingComment = generateComment(file);

  debug('Signing package %s, comment=%s', file, signingComment);

  if (!file) {
    throw new Error('notarize artifact: missing file');
  }

  if (
    !process.env.NOTARY_URL ||
    !process.env.NOTARY_SIGNING_KEY ||
    !process.env.NOTARY_AUTH_TOKEN
  ) {
    const missingVars = [
      'NOTARY_URL',
      'NOTARY_SIGNING_KEY',
      'NOTARY_AUTH_TOKEN',
    ].filter((varName) => !process.env[varName]);
    throw new Error(`Missing required env vars: ${missingVars.join(', ')}`);
  }

  const options: NotarizeOptions = {
    signingComment,
    serverUrl: process.env.NOTARY_URL,
    signingKeyName: process.env.NOTARY_SIGNING_KEY,
    authToken: process.env.NOTARY_AUTH_TOKEN,
    clientPath:
      process.platform === 'win32'
        ? 'C:\\cygwin\\usr\\local\\bin\\notary-client.py'
        : '/usr/local/bin/notary-client.py',
    pythonExecutable:
      process.platform === 'win32' ? 'python' : '/usr/bin/python',
  };

  const authTokenFile = path.join(
    os.homedir(),
    `.notary-mongosh-token.${Date.now()}.tmp`
  );
  await fs.writeFile(authTokenFile, options.authToken, {
    encoding: 'utf8',
    mode: 0o600,
  });
  console.info(
    'Notarizing file',
    options.signingKeyName,
    options.signingComment,
    file
  );

  try {
    spawnSync(
      options.pythonExecutable,
      [
        options.clientPath,
        '--key-name',
        options.signingKeyName,
        '--auth-token-file',
        authTokenFile,
        '--comment',
        options.signingComment,
        '--notary-url',
        options.serverUrl,
        '--outputs',
        'sig',
        '--package-file-suffix',
        '',
        path.basename(file),
      ],
      {
        cwd: path.dirname(file),
        encoding: 'utf8',
      }
    );
  } finally {
    try {
      await fs.unlink(authTokenFile);
    } catch (e: any) {
      console.error('mongosh: Failed to remove auth token file', e);
    }
  }
}

export function spawnSync(
  command: string,
  args: string[],
  options: SpawnSyncOptionsWithStringEncoding
): SpawnSyncReturns<string>;
export function spawnSync(
  command: string,
  args: string[],
  options: SpawnSyncOptionsWithStringEncoding,
  ignoreErrors: false
): SpawnSyncReturns<string>;
export function spawnSync(
  command: string,
  args: string[],
  options: SpawnSyncOptionsWithStringEncoding,
  ignoreErrors: true
): SpawnSyncReturns<string> | undefined;
export function spawnSync(
  command: string,
  args: string[],
  options: SpawnSyncOptionsWithStringEncoding,
  ignoreErrors = false
): SpawnSyncReturns<string> | undefined {
  const result = spawn.sync(command, args, options);
  if (result.error) {
    console.error('spawn.sync returned error', result.error);
    console.error(result.stdout);
    console.error(result.stderr);

    if (!ignoreErrors) {
      throw new Error(
        `Failed to spawn ${command}, args: ${args.join(',')}: ${
          result.error.stack || 'Unknown error'
        }`
      );
    } else {
      console.warn('Ignoring error and continuing...');
    }
  } else if (result.status !== 0) {
    console.error('spawn.sync exited with non-zero', result.status);
    console.error(result.stdout);
    console.error(result.stderr);
    if (!ignoreErrors) {
      throw new Error(
        `Spawn exited non-zero for ${command}, args: ${args.join(',')}: ${
          result.status?.toString() || ''
        }`
      );
    } else {
      console.warn('Ignoring error and continuing...');
    }
  }
  return result;
}
