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
      fs.rmSync(installLocation, { recursive: true, force: true });
    }
  }

  uninstall({ expectMissing: true });

  // Run the installer
  console.warn(
    "Installing globally, since we haven't discovered a way to specify an install path"
  );
  execute(filepath, []);

  const entry = queryRegistry();
  assert(entry !== null, 'Expected an entry in the registry after installing');
  const { InstallLocation: appPath } = entry;
  assert(
    typeof appPath === 'string',
    'Expected an entry in the registry with the install location'
  );
  const appExecutablePath = path.resolve(appPath, `${appName}.exe`);
  execute(appExecutablePath, ['--version']);

  return {
    appName,
    appPath,
    uninstall,
  };
}
