import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import cp from 'node:child_process';
import createDebug from 'debug';

import type { InstalledAppInfo, InstallablePackage } from './types';
import { execute } from '../execute';
import * as windowsRegistry from './windows-registry';

const debug = createDebug('compass:smoketests:windows-setup');

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
  kind,
  filepath,
  buildInfo,
  sandboxPath,
}: InstallablePackage): InstalledAppInfo {
  assert.equal(kind, 'windows_setup');
  const appName = buildInfo.installerOptions.name;

  function queryRegistry() {
    return windowsRegistry.query(
      `HKEY_CURRENT_USER\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${appName}`
    );
  }

  function uninstall({ expectMissing = false }: UninstallOptions = {}) {
    debug('Uninstalling %s', filepath);
    const entry = queryRegistry();
    if (entry) {
      const {
        InstallLocation: installLocation,
        UninstallString: uninstallCommand,
      } = entry;
      assert(
        typeof installLocation === 'string',
        'Expected an entry in the registry with the install location'
      );
      assert(
        typeof uninstallCommand === 'string',
        'Expected an entry in the registry with the uninstall command'
      );
      if (expectMissing) {
        console.warn(
          'Found an existing registry entry (likely from a previous run)'
        );
      }
      assert(
        typeof uninstallCommand === 'string',
        'Expected an UninstallString in the registry entry'
      );
      debug(`Running command to uninstall: ${uninstallCommand}`);
      cp.execSync(uninstallCommand, { stdio: 'inherit' });
      // Removing the any remaining files manually
      try {
        if (fs.existsSync(installLocation)) {
          debug(`Removing installer: ${installLocation}`);
          fs.rmSync(installLocation, { recursive: true, force: true });
        }
      } catch (error) {
        console.warn(
          `Failed to remove install location ${installLocation}: ${
            error instanceof Error ? error.message : error
          }`
        );
      }
    }
  }

  uninstall({ expectMissing: true });

  // Run the installer
  console.warn(
    "Installing globally, since we haven't discovered a way to specify an install path"
  );
  execute(
    filepath,
    [
      // See https://github.com/Squirrel/Squirrel.Windows/blob/51f5e2cb01add79280a53d51e8d0cfa20f8c9f9f/src/Setup/winmain.cpp#L60C22-L68
      '--checkInstall',
    ],
    {
      env: {
        // See https://github.com/Squirrel/Squirrel.Windows/blob/51f5e2cb01add79280a53d51e8d0cfa20f8c9f9f/src/Setup/UpdateRunner.cpp#L173C40-L173C54
        SQUIRREL_TEMP: sandboxPath,
      },
    }
  );

  const entry = queryRegistry();
  assert(entry !== null, 'Expected an entry in the registry after installing');
  const { InstallLocation: appPath } = entry;
  assert(
    typeof appPath === 'string',
    'Expected an entry in the registry with the install location'
  );
  const appExecutablePath = path.resolve(appPath, `${appName}.exe`);

  // Check if the app executable exists after installing
  assert(
    fs.existsSync(appExecutablePath),
    `Expected ${appExecutablePath} to exist`
  );

  return {
    appName,
    appPath,
    uninstall,
  };
}
