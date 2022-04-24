import execa from 'execa';

export async function installProductionDeps(context: {
  buildPath: string;
}): Promise<void> {
  await execa('npm', ['install', '--production'], {
    cwd: context.buildPath,
    stdio: 'inherit',
  });
}
