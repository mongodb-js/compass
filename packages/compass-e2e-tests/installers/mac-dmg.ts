import path from 'path';
import { existsSync } from 'fs';
import type { InstalledAppInfo, Package } from './types';
import { execute } from './helpers';

export async function installMacDMG(
  appName: string,
  { filepath }: Package
): Promise<InstalledAppInfo> {
  const fullDestinationPath = `/Applications/${appName}.app`;

  if (existsSync(fullDestinationPath)) {
    // Would ideally just throw here, but unfortunately in CI the mac
    // environments aren't all clean so somewhere we have to remove it anyway.
    console.log(`${fullDestinationPath} already exists. Removing.`);
    await execute('rm', ['-rf', fullDestinationPath]);
  }

  await execute('hdiutil', ['attach', filepath]);
  try {
    await execute('cp', [
      '-Rp',
      `/Volumes/${appName}/${appName}.app`,
      '/Applications',
    ]);
  } finally {
    await execute('hdiutil', ['detach', `/Volumes/${appName}`]);
  }

  // get debug output so we can see that it copied everything with the correct
  // permissions
  await execute('ls', ['-laR', `/Applications/${appName}.app`]);

  // see if the executable will run without being quarantined or similar
  await execute(`/Applications/${appName}.app/Contents/MacOS/${appName}`, [
    '--version',
  ]);

  if (process.env.HOME) {
    const settingsDir = path.resolve(
      process.env.HOME,
      'Library',
      'Application Support',
      appName
    );

    if (existsSync(settingsDir)) {
      console.log(`${settingsDir} already exists. Removing.`);
      await execute('rm', ['-rf', settingsDir]);
    }
  }

  return Promise.resolve({
    appName,
    appPath: `/Applications/${appName}.app`,
  });
}
