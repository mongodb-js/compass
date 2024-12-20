import { existsSync } from 'fs';
import { assertSpawnSyncResult } from './helpers';
import type { InstalledAppInfo, Package } from './types';
import { spawnSync } from 'child_process';

function exec(command: string, args: string[]) {
  console.log(command, ...args);

  assertSpawnSyncResult(
    spawnSync(command, args, {
      encoding: 'utf8',
      stdio: 'inherit',
    }),
    `${command} ${args.join(' ')}`
  );
}

export async function installMacDMG(
  appName: string,
  { filepath }: Package
): Promise<InstalledAppInfo> {
  const fullDestinationPath = `/Applications/${appName}.app`;

  if (existsSync(fullDestinationPath)) {
    throw new Error(`${fullDestinationPath} already exists`);
  }

  exec('hdiutil', ['attach', filepath]);
  try {
    exec('cp', ['-r', `/Volumes/${appName}/${appName}.app`, '/Applications']);
  } finally {
    exec('hdiutil', ['detach', `/Volumes/${appName}`]);
  }

  return Promise.resolve({
    appName,
    appPath: `/Applications/${appName}.app`,
  });
}
