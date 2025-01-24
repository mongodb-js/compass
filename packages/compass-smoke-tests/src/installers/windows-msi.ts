import path from 'node:path';

import type { InstalledAppInfo, InstallablePackage } from './types';
import { execute, ExecuteFailure } from '../execute';

// See https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/msiexec

export function installWindowsMSI({
  appName,
  filepath,
  destinationPath,
}: InstallablePackage): InstalledAppInfo {
  const installDirectory = path.resolve(destinationPath, appName);
  const appPath = path.resolve(installDirectory, `${appName}.exe`);

  function uninstall() {
    execute('msiexec', ['/uninstall', filepath, '/passive']);
  }

  // Installing an MSI which is already installed is a no-op
  // So we uninstall the MSI first (which will use the PackageCode to find the installed application)
  // It is fine if the uninstall exists with status 1605, as this happens if the app wasn't already installed.
  try {
    uninstall();
  } catch (err) {
    if (err instanceof ExecuteFailure && err.status === 1605) {
      console.log(
        "Uninstalling before installing failed, which is expected if the app wasn't already installed"
      );
    } else {
      throw err;
    }
  }

  execute('msiexec', [
    '/package',
    filepath,
    '/passive',
    `APPLICATIONROOTDIRECTORY=${installDirectory}`,
  ]);

  // Check that the executable will run without being quarantined or similar
  execute(appPath, ['--version']);

  return {
    appPath: installDirectory,
    uninstall,
  };
}
