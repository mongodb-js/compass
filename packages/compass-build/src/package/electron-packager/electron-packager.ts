import type { Options as ElectronPackagerInternalOptions } from 'electron-packager';
import electronPackager from 'electron-packager';
import util from 'util';
import path from 'path';

import { replaceFfmpeg } from './hooks/replace-ffmpeg';
import { cleanChromiumLicense } from './hooks/clean-chromium-license';
import { writeVersionFile } from './hooks/write-version-file';
import type { ProductConfig } from '../../config/product-config';
import type { PackageOptions } from '../package-options';

type PlatformOverrides = Partial<
  Pick<
    ElectronPackagerInternalOptions,
    'name' | 'icon' | 'win32metadata' | 'appBundleId' | 'appCategoryType'
  >
>;

export async function runElectronPackager(
  options: PackageOptions,
  productConfig: ProductConfig,
  platformOverrides: PlatformOverrides
): Promise<string> {
  const afterExtract = async (
    buildPath: string,
    electronVersion: string,
    platform: string,
    arch: string
  ) => {
    const context = { buildPath, electronVersion, platform, arch };

    await Promise.all([
      cleanChromiumLicense(context),
      writeVersionFile(productConfig.version, context),
    ]);
  };

  const electronPackagerOptions: ElectronPackagerInternalOptions = {
    dir: options.paths.packagerSrc,
    out: options.paths.packagerDest,
    overwrite: true,
    appCopyright: productConfig.copyright,
    buildVersion: productConfig.version,
    appVersion: productConfig.version,
    platform: options.platform,
    arch: options.arch,
    asar: options.asar ?? {
      unpack: `{${[
        '*.node',
        '**/vendor/**',
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
      ].join(',')}}`,
    },
    afterExtract: [replaceFfmpeg, util.callbackify(afterExtract)],
    name: productConfig.productName,
    protocols: [],
    ...platformOverrides,
  };

  console.info(
    'Running electron packager',
    util.inspect(electronPackagerOptions)
  );

  await electronPackager(electronPackagerOptions);

  const { out, name, platform, arch } = electronPackagerOptions;

  return path.resolve(out!, [name, platform, arch].join('-'));
}
