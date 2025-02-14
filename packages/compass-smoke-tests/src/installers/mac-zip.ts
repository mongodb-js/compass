import assert from 'node:assert/strict';
import path from 'node:path';
import {
  assertFileNotQuarantined,
  removeApplicationSupportForApp,
} from './mac-utils';
import type { InstalledAppInfo, InstallablePackage } from './types';
import { execute } from '../execute';

export function installMacZIP({
  kind,
  filepath,
  sandboxPath,
  buildInfo,
}: InstallablePackage): InstalledAppInfo {
  assert.equal(kind, 'osx_zip');
  const appName = buildInfo.productName;
  const appFilename = `${appName}.app`;
  const appPath = path.resolve(sandboxPath, appFilename);

  execute('ditto', ['-xk', filepath, sandboxPath]);

  removeApplicationSupportForApp(appName);

  assertFileNotQuarantined(appPath);

  return {
    appName,
    appPath: appPath,
    uninstall: async function () {
      /* TODO */
    },
  };
}
