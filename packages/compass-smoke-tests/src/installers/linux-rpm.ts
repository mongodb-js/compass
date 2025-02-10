import assert from 'node:assert/strict';
import cp from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

import type { InstalledAppInfo, InstallablePackage } from './types';
import { execute } from '../execute';
/**
 * Call dnf to get the package name
 */
function getPackageName(filepath: string) {
  const result = cp.spawnSync(
    'dnf',
    ['repoquery', '--queryformat', '%{NAME}', filepath],
    { encoding: 'utf8' }
  );
  assert.equal(
    result.status,
    0,
    `Expected a clean exit, got status ${result.status || 'null'}`
  );
  return result.stdout.trim();
}

/**
 * Check if a package is installed (by name)
 */
export function isInstalled(packageName: string) {
  const result = cp.spawnSync('dnf', ['list', 'installed', packageName], {
    stdio: 'inherit',
  });
  return result.status === 0;
}

export function installLinuxRpm({
  appName,
  filepath,
}: InstallablePackage): InstalledAppInfo {
  const packageName = getPackageName(filepath);
  const installPath = `/usr/lib/${packageName}`;
  const appPath = path.resolve(installPath, appName);

  function uninstall() {
    execute('dnf', ['dnf', 'remove', '-y', packageName]);
  }

  if (isInstalled(packageName)) {
    console.warn(
      'Found an existing install directory (likely from a previous run): Uninstalling first'
    );
    uninstall();
  }

  console.warn(
    "Installing globally, since we haven't discovered a way to specify an install path"
  );
  assert(!isInstalled(packageName), 'Expected the package to not be installed');
  assert(
    !fs.existsSync(installPath),
    `Expected no install directory to exist: ${installPath}`
  );
  execute('dnf', ['install', '-y', filepath]);

  assert(isInstalled(packageName), 'Expected the package to be installed');
  assert(
    fs.existsSync(installPath),
    `Expected an install directory to exist: ${installPath}`
  );

  // Check that the executable will run without being quarantined or similar
  execute('xvfb-run', [appPath, '--version', '--no-sandbox']); // Remove '--no-sandbox' if we don't plan on running this as root

  return {
    appPath: installPath,
    uninstall,
  };
}
