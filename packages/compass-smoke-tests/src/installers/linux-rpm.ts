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
  const { status, stdout, stderr } = cp.spawnSync(
    'rpm',
    ['--query', '--queryformat', '%{NAME}', '--package', filepath],
    { encoding: 'utf8' }
  );
  assert.equal(
    status,
    0,
    `Expected a clean exit, got status ${status || 'null'}: ${stderr}`
  );
  return stdout.trim();
}

/**
 * Check if a package is installed (by name)
 */
export function isInstalled(packageName: string) {
  const result = cp.spawnSync(
    'sudo',
    ['dnf', 'list', 'installed', packageName],
    {
      stdio: 'inherit',
    }
  );
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
    execute('sudo', ['dnf', 'remove', '-y', packageName]);
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
  execute('sudo', ['dnf', 'install', '-y', filepath]);

  assert(isInstalled(packageName), 'Expected the package to be installed');
  assert(
    fs.existsSync(installPath),
    `Expected an install directory to exist: ${installPath}`
  );

  // Check that the executable will run without being quarantined or similar
  execute('xvfb-run', [appPath, '--version']);

  return {
    appPath: installPath,
    uninstall,
  };
}
