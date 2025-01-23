import path from 'node:path';
import fs from 'node:fs';

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

  const executablePath = path.resolve(appPath, 'Contents/MacOS', appName);

  execute('xattr', ['-l', appPath]);
  execute('xattr', ['-l', executablePath]);

  // see if the executable will run without being quarantined or similar
  // TODO: Move this somewhere shared between mac installers
  execute(executablePath, ['--version']);

  return {
    appPath: appPath,
    uninstall: async function () {
      /* TODO */
    },
  };
}
