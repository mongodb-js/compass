import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import {
  assertFileNotQuarantined,
  removeApplicationSupportForApp,
} from './mac-utils';

import type { InstalledAppInfo, InstallablePackage } from './types';
import { execute } from '../execute';

export function installMacDMG({
  kind,
  filepath,
  sandboxPath,
  buildInfo,
}: InstallablePackage): InstalledAppInfo {
  assert.equal(kind, 'osx_dmg');
  const appName = buildInfo.productName;
  const appFilename = `${buildInfo.productName}.app`;
  const appPath = path.resolve(sandboxPath, appFilename);
  const volumePath = path.resolve(
    sandboxPath,
    buildInfo.installerOptions.title
  );

  execute('hdiutil', ['attach', '-mountroot', sandboxPath, filepath]);
  assert(fs.existsSync(volumePath), `Expected a mount: ${volumePath}`);

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
    appName,
    appPath: appPath,
    uninstall: async function () {
      /* TODO */
    },
  };
}
