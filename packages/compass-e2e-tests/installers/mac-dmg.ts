import { existsSync } from 'fs';
import type { InstalledAppInfo, Package } from './types';
import { execute } from './helpers';

export async function installMacDMG(
  appName: string,
  { filepath }: Package
): Promise<InstalledAppInfo> {
  const fullDestinationPath = `/Applications/${appName}.app`;

  if (existsSync(fullDestinationPath)) {
    throw new Error(`${fullDestinationPath} already exists`);
  }

  await execute('hdiutil', ['attach', filepath]);
  try {
    await execute(
      'cp',
      ['-Rp', `/Volumes/${appName}/${appName}.app`, '/Applications'],
      { shell: true }
    );
  } finally {
    await execute('hdiutil', ['detach', `/Volumes/${appName}`]);
  }

  if (!existsSync(`/Applications/${appName}.app/Contents/MacOS/${appName}`)) {
    throw new Error('app not found');
  }

  return Promise.resolve({
    appName,
    appPath: `/Applications/${appName}.app`,
  });
}
