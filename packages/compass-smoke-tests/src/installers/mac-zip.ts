import path from 'node:path';
import fs from 'node:fs';

import createDebug from 'debug';

import type { InstalledAppInfo, InstallablePackage } from './types';
import { execute } from '../execute';

const debug = createDebug('compass-smoke-tests:installers:mac-zip');

export function installMacZIP({
  appName,
  filepath,
  destinationPath,
}: InstallablePackage): InstalledAppInfo {
  const appFilename = `${appName}.app`;
  const appPath = path.resolve(destinationPath, appFilename);

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

    if (fs.existsSync(settingsDir)) {
      debug(`${settingsDir} already exists. Removing.`);
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
