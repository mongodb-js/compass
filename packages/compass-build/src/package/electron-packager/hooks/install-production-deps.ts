import execa from 'execa';
import { promises as fs } from 'fs';
import path from 'path';

export async function installProductionDeps(context: {
  buildPath: string;
}): Promise<void> {
  await fs
    .access(path.join(context.buildPath, 'package.json'))
    .catch((e: Error) => {
      throw new Error(`package.json not found in path: ${e?.message || ''}`);
    });

  await execa('npm', ['install'], {
    cwd: context.buildPath,
    stdio: 'inherit',
  });
}
