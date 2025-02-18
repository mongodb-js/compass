import assert from 'node:assert/strict';
import path from 'node:path';

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

  // see if the executable will run without being quarantined or similar
  execute(appPath, ['--version']);

  return {
    appName,
    appPath: sandboxPath,
    uninstall: async function () {
      /* TODO */
    },
  };
}
