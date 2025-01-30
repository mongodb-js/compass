import path from 'node:path';
import {
  assertFileNotQuarantined,
  removeApplicationSupportForApp,
} from './mac-utils';
import type { InstalledAppInfo, InstallablePackage } from './types';
import { execute } from '../execute';

export function installMacZIP({
  appName,
  filepath,
  destinationPath,
}: InstallablePackage): InstalledAppInfo {
  const appFilename = `${appName}.app`;
  const appPath = path.resolve(destinationPath, appFilename);

  execute('ditto', ['-xk', filepath, destinationPath]);

  removeApplicationSupportForApp(appName);

  assertFileNotQuarantined(appPath);

  return {
    appPath: appPath,
    uninstall: async function () {
      /* TODO */
    },
  };
}
