import { promises as fs } from 'fs';
import path from 'path';

import { compileAssets } from './compile';
import { runElectronPackager } from './electron-packager/electron-packager';

export type CompassDistribution =
  | 'compass'
  | 'compass-isolated'
  | 'compass-readonly';

export type DarwinPackageType = 'zip' | 'dmg';
export type Win32PackageType = 'zip' | 'msi' | 'exe';
export type LinuxPackageType = 'tar' | 'rpm' | 'deb';
export type PackageType =
  | DarwinPackageType
  | Win32PackageType
  | LinuxPackageType;

export type Platform = 'darwin' | 'linux' | 'win32';

export type PackageOptions = {
  sourcePath: string;
  distribution: CompassDistribution;
  compile: boolean;
  arch: typeof process.arch;
  sign: boolean;
  asar: boolean;
  packages:
    | Set<DarwinPackageType>
    | Set<LinuxPackageType>
    | Set<Win32PackageType>;
  platform: Platform;
};

export async function packageCompass(options: PackageOptions): Promise<void> {
  const packageJson = JSON.parse(
    await fs.readFile(path.resolve(options.sourcePath, 'package.json'), 'utf-8')
  );
  const channel = 'dev';
  const name = 'compass';
  const productName = 'MongoDB Compass';
  const autoUpdateEndpoint = 'something';

  if (options.compile) {
    await compileAssets(options.sourcePath, {
      version: packageJson.version,
      channel,
      distribution: options.distribution,
      name,
      productName,
      autoUpdateEndpoint,
    });
  }

  await runElectronPackager({
    dir: options.sourcePath,
    name: productName,
    out: path.resolve(options.sourcePath, 'dist'),
    version: '1.2.3-dev.0',
    copyright: 'MongoDB Inc',
    files: ['build/**', 'package.json', 'LICENSE'],
    platform: options.platform,
    arch: options.arch,
    asar: options.asar && { unpack: [] },
    rebuild: {
      onlyModules: [],
    },
    platformOptions: {
      darwin: {},
      win32: {
        name: productName.replace(/ /g, ''),
      },
      linux: {},
    },
  });
}
