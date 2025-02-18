import assert from 'node:assert/strict';
import path from 'node:path';

import type { InstalledAppInfo, InstallablePackage } from './types';
import { execute } from '../execute';

export function installLinuxTar({
  kind,
  filepath,
  sandboxPath,
  buildInfo,
}: InstallablePackage): InstalledAppInfo {
  assert.equal(kind, 'linux_tar');
  const appName = buildInfo.productName;
  const appFilename = `${appName}-linux-x64`;
  const appPath = path.resolve(sandboxPath, appFilename);

  execute('tar', ['-xzvf', filepath, '-C', sandboxPath]);

  // Check that the executable will run without being quarantined or similar
  execute('xvfb-run', [path.resolve(appPath, appName), '--version']);

  return {
    appName,
    appPath,
    uninstall: async function () {
      /* TODO */
    },
  };
}
