import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import createDebug from 'debug';

const debug = createDebug('compass:smoketests:mac-utils');

// TODO: Consider instrumenting the app to use a settings directory in the sandbox
export function removeApplicationSupportForApp(appName: string) {
  assert(typeof process.env.HOME === 'string', 'HOME env var not set');

  const settingsDir = path.resolve(
    process.env.HOME,
    'Library',
    'Application Support',
    appName
  );

  if (fs.existsSync(settingsDir)) {
    debug(`${settingsDir} already exists. Removing.`);
    fs.rmSync(settingsDir, { recursive: true });
  }
}

export function assertFileNotQuarantined(appPath: string) {
  try {
    execSync(`xattr -p com.apple.quarantine "${appPath}"`, {
      encoding: 'utf8',
    });
    assert.fail(`Expected no com.apple.quarantine attr on ${appPath}`);
  } catch (err: unknown) {
    assert(
      typeof err === 'object' &&
        err !== null &&
        'message' in err &&
        typeof err.message === 'string',
      'Expected err to be an error'
    );
    assert(
      /No such xattr/.test(err.message),
      `Expected no com.apple.quarantine attr on ${appPath}`
    );
  }
}
