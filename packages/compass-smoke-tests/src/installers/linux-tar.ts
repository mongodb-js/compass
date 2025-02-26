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
  // Passing --no-sandbox because RHEL and Rocky usually run as root and --disable-gpu to avoid warnings
  // (see compass-e2e-tests/helpers/chrome-startup-flags.ts for details)
  execute('xvfb-run', [
    path.resolve(appPath, appName),
    '--version',
    '--no-sandbox',
    '--disable-gpu',
  ]);

  return {
    appName,
    appPath,
    uninstall: async function () {
      /* TODO */
    },
  };
}
