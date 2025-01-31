import path from 'node:path';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import cp from 'node:child_process';

import type { InstalledAppInfo, InstallablePackage } from './types';
import { execute } from '../execute';
import * as windowsRegistry from './windows-registry';

type UninstallOptions = {
  /**
   * Expect the app to already be uninstalled, warn if that's not the case.
   */
  expectMissing?: boolean;
};

/**
 * Install using the Windows installer.
 */
export function installWindowsSetup({
  appName,
  filepath,
}: InstallablePackage): InstalledAppInfo {
  const { LOCALAPPDATA: LOCAL_APPDATA_PATH } = process.env;
  assert(
    typeof LOCAL_APPDATA_PATH === 'string',
    'Expected a LOCALAPPDATA environment injected by the shell'
  );
  const installDirectory = path.resolve(LOCAL_APPDATA_PATH, appName);

  function uninstall({ expectMissing = false }: UninstallOptions = {}) {
    const registryEntry = windowsRegistry.query(
      `HKEY_CURRENT_USER\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${appName}`
    );
    if (registryEntry) {
      if (expectMissing) {
        console.warn(
          'Found an existing registry entry (likely from a previous run)'
        );
      }
      const { UninstallString: uninstallCommand } = registryEntry;
      assert(
        typeof uninstallCommand === 'string',
        'Expected an UninstallString in the registry entry'
      );
      console.log(`Running command to uninstall: ${uninstallCommand}`);
      cp.execSync(uninstallCommand, { stdio: 'inherit' });
    }
    // Removing the any remaining files
    fs.rmSync(installDirectory, { recursive: true, force: true });
  }

  uninstall({ expectMissing: true });

  // Assert the app is not on the filesystem at the expected location
  assert(
    !fs.existsSync(installDirectory),
    `Delete any existing installations first (found ${installDirectory})`
  );

  // Run the installer
  console.warn(
    "Installing globally, since we haven't discovered a way to specify an install path"
  );
  execute(filepath, []);

  const appPath = path.resolve(installDirectory, `${appName}.exe`);
  execute(appPath, ['--version']);

  return {
    appPath: installDirectory,
    uninstall,
  };
}
