import execa from 'execa';

export async function installProductionDeps(context: {
  appDir: string;
}): Promise<void> {
  await execa('npm', ['install', '--production'], {
    cwd: context.appDir,
    stdio: 'inherit',
  });
}
