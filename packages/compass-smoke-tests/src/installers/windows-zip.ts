import path from 'node:path';

import type { InstalledAppInfo, InstallablePackage } from './types';
import { execute } from '../execute';

export function installWindowsZIP({
  appName,
  filepath,
  destinationPath,
}: InstallablePackage): InstalledAppInfo {
  const appPath = path.resolve(destinationPath, `${appName}.exe`);

  execute('unzip', [filepath, '-d', destinationPath]);

  // see if the executable will run without being quarantined or similar
  execute(appPath, ['--version']);

  return {
    appPath: destinationPath,
    uninstall: async function () {
      /* TODO */
    },
  };
}
