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

    if (fs.existsSync(settingsDir)) {
      console.log(`${settingsDir} already exists. Removing.`);
      fs.rmSync(settingsDir, { recursive: true });
    }
  }

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
