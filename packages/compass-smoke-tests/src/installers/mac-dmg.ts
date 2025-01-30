import path from 'node:path';
import fs from 'node:fs';
import {
  assertFileNotQuarantined,
  removeApplicationSupportForApp,
} from './mac-utils';

import type { InstalledAppInfo, InstallablePackage } from './types';
import { execute } from '../execute';

export function installMacDMG({
  appName,
  filepath,
  destinationPath,
}: InstallablePackage): InstalledAppInfo {
  const appFilename = `${appName}.app`;
  const appPath = path.resolve(destinationPath, appFilename);
  const volumePath = `/Volumes/${appName}`;

  execute('hdiutil', ['attach', filepath]);

  try {
    fs.cpSync(path.resolve(volumePath, appFilename), appPath, {
      recursive: true,
      verbatimSymlinks: true,
    });
  } finally {
    execute('hdiutil', ['detach', volumePath]);
  }

  removeApplicationSupportForApp(appName);

  assertFileNotQuarantined(appPath);

  return {
    appPath: appPath,
    uninstall: async function () {
      /* TODO */
    },
  };
}
