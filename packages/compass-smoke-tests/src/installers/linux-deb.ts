import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import type { InstalledAppInfo, InstallablePackage } from './types';
import { execute } from '../execute';
import * as apt from './apt';

export function installLinuxDeb({
  appName,
  filepath,
}: InstallablePackage): InstalledAppInfo {
  const packageName = apt.getPackageName(filepath);
  const installPath = `/usr/lib/${packageName}`;
  const appPath = path.resolve(installPath, appName);

  function uninstall() {
    execute('sudo', ['apt', 'remove', '--yes', '--purge', packageName]);
  }

  console.warn(
    "Installing globally, since we haven't discovered a way to specify an install path"
  );

  if (fs.existsSync(installPath)) {
    console.warn(
      'Found an existing install directory (likely from a previous run): Uninstalling first'
    );
    uninstall();
  }

  assert(
    !fs.existsSync(installPath),
    `Expected no install directory to exist: ${installPath}`
  );
  console.warn(
    "Installing globally, since we haven't discovered a way to specify an install path"
  );
  execute('sudo', ['apt', 'install', filepath]);

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
