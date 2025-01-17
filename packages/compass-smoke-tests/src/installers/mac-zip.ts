import path from 'node:path';
import fs from 'node:fs';

import type { InstalledAppInfo, InstallablePackage } from './types';
import { execute } from '../execute';

export function installMacZIP({
  appName,
  filepath,
  destinationPath,
}: InstallablePackage): InstalledAppInfo {
  const appFilename = `${appName}.app`;
  const appPath = path.resolve(destinationPath, appFilename);

  execute('umask', []);

  execute('ditto', ['-xk', filepath, destinationPath]);

  // TODO: Consider instrumenting the app to use a settings directory in the sandbox
  // TODO: Move this somewhere shared between mac installers
  if (process.env.HOME) {
    const settingsDir = path.resolve(
      process.env.HOME,
      'Library',
      'Application Support',
      appName
    );
    const shipitDir = path.resolve(
      process.env.HOME,
      'Library',
      'Caches',
      'com.mongodb.compass.dev.ShipIt'
    );

    for (const dir of [settingsDir, shipitDir]) {
      if (fs.existsSync(dir)) {
        console.log(`${dir} already exists. Removing.`);
        fs.rmSync(dir, { recursive: true });
      }
    }
  }

  execute('xattr', ['-dr', 'com.apple.quarantine', appPath]);

  // see if the executable will run without being quarantined or similar
  // TODO: Move this somewhere shared between mac installers
  execute(path.resolve(appPath, 'Contents/MacOS', appName), ['--version']);

  return {
    appPath: appPath,
    uninstall: async function () {
      /* TODO */
    },
  };
}
