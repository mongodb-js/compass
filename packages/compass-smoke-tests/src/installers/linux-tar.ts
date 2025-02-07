import path from 'node:path';

import type { InstalledAppInfo, InstallablePackage } from './types';
import { execute } from '../execute';

export function installLinuxTar({
  appName,
  filepath,
  destinationPath,
}: InstallablePackage): InstalledAppInfo {
  const appFilename = `${appName}-linux-x64`;
  const appPath = path.resolve(destinationPath, appFilename);

  execute('tar', ['-xzvf', filepath, '-C', destinationPath]);

  // Check that the executable will run without being quarantined or similar
  execute('xvfb-run', [path.resolve(appPath, appName), '--version']);

  return {
    appPath,
    uninstall: async function () {
      /* TODO */
    },
  };
}
