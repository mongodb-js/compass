import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';

import type { InstalledAppInfo, InstallablePackage } from './types';
import { execute } from '../execute';

export function installWindowsZIP({
  kind,
  filepath,
  sandboxPath,
  buildInfo,
}: InstallablePackage): InstalledAppInfo {
  assert.equal(kind, 'windows_zip');
  const appName = buildInfo.installerOptions.name;
  const appPath = path.resolve(sandboxPath, `${appName}.exe`);

  execute('unzip', [filepath, '-d', sandboxPath]);

  // Check if the app executable exists after unzipping
  assert(fs.existsSync(appPath), `Expected ${appPath} to exist`);

  return {
    appName,
    appPath: sandboxPath,
    uninstall: async function () {
      /* TODO */
    },
  };
}
