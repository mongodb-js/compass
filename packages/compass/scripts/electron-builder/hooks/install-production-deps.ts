import execa from 'execa';
import type { BeforeBuildContext } from 'electron-builder';

export async function installProductionDeps(context: {
  appDir: string;
}): Promise<void> {
  await execa('npm', ['install', '--production'], {
    cwd: context.appDir,
  });
}
