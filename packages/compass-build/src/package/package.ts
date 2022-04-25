import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

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

// async function prepareProjectDir(distributionInfo: { productName: string }) {
//   console.log('Creating project dir', projectDir);
//   mkdirpSync(projectDir);

//   console.log('Copying project files to', projectDir);
//   for (const file of ['LICENSE', 'build']) {
//     copySync(file, path.join(projectDir, file));
//   }

//   // We clean up the package.json as it may contain settings
//   // that would affect electron-builder
//   const {
//     name,
//     main,
//     version,
//     dependencies,
//     engines,
//     author,
//     description,
//     license,
//     devDependencies,
//     repository,
//   } = packageJson;

//   fs.writeFileSync(
//     path.join(projectDir, 'package.json'),
//     JSON.stringify({
//       name,
//       version,
//       productName: distributionInfo.productName,
//       description,
//       author,
//       engines,
//       license,
//       dependencies,
//       main,
//       repository,
//       devDependencies: {
//         electron: devDependencies.electron,
//       },
//     })
//   );

//   console.log('Installing production deps');
//   await installProductionDeps({ appDir: projectDir });

//   console.log('Rebuilding native modules');
//   await rebuildNativeModules({
//     appDir: projectDir,
//     electronVersion: packageJson.devDependencies.electron,
//   });
// }

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
    sourcePath: options.sourcePath,
    name: productName,
    out: path.resolve(options.sourcePath, 'dist'),
    version: '1.2.3-dev.0',
    copyright: 'MongoDB Inc',
    files: ['build/**'],
    platform: options.platform,
    arch: options.arch,
    asar: options.asar && {
      unpack: [
        '**/@mongosh/node-runtime-worker-thread/**',
        '**/interruptor/**',
        '**/kerberos/**',
        '**/snappy/**',
        '**/mongodb-client-encryption/index.js',
        '**/mongodb-client-encryption/package.json',
        '**/mongodb-client-encryption/lib/**',
        '**/mongodb-client-encryption/build/**',
        '**/bl/**',
        '**/nan/**',
        '**/node_modules/bindings/**',
        '**/file-uri-to-path/**',
        '**/bson/**',
        '**/os-dns-native/**',
        '**/debug/**',
        '**/ms/**',
        '**/bindings/**',
        '**/ipv6-normalize/**',
        '**/node-addon-api/**',
        '**/win-export-certificate-and-key/**',
        '**/macos-export-certificate-and-key/**',
        '**/system-ca/**',
      ],
    },
    rebuild: {
      onlyModules: [
        'interruptor',
        'keytar',
        'kerberos',
        'os-dns-native',
        'win-export-certificate-and-key',
        'macos-export-certificate-and-key',
      ],
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
