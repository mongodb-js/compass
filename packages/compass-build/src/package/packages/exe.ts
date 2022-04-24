import type { Options } from 'electron-winstaller';
import electronWinstaller from 'electron-winstaller';
import { promises as fs } from 'fs';
import path from 'path';

export type ExeInstallerOptions = Omit<Options, 'msi'> & {
  releasesFileName?: string;
};

export async function exe(options: ExeInstallerOptions): Promise<void> {
  if (!options.outputDirectory) {
    throw new Error(`options.outputDirectory must be set`);
  }

  const { releasesFileName, ...winstallerOptions } = options;

  await electronWinstaller.createWindowsInstaller({
    ...winstallerOptions,
    noMsi: true,
  });

  if (releasesFileName && releasesFileName !== 'RELEASES') {
    await fs.rename(
      path.join(options.outputDirectory, 'RELEASES'),
      path.join(options.outputDirectory, releasesFileName)
    );
  }
}
