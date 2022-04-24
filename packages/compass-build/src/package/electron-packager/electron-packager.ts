import type { Options as ElectronPackagerInternalOptions } from 'electron-packager';
import electronPackager from 'electron-packager';
import minimatch from 'minimatch';
import path from 'path';
import util from 'util';

import { installProductionDeps } from './hooks/install-production-deps';
import { rebuildNativeModules } from './hooks/rebuild-native-modules';

import { replaceFfmpeg } from './hooks/replace-ffmpeg';
import { cleanChromiumLicense } from './hooks/clean-chromium-license';
import { writeVersionFile } from './hooks/write-version-file';

type PlatformOverrides = Partial<
  Pick<
    ElectronPackagerInternalOptions,
    'name' | 'icon' | 'win32metadata' | 'appBundleId' | 'appCategoryType'
  >
>;

export type ElectronPackagerOptions = {
  /**
   * Source dir
   */
  dir: string;

  /**
   * Output dir
   */
  out: string;
  version: string;
  copyright: string;

  /**
   * Product name
   */
  name: string;

  /**
   * Files to be copied from source dir
   */
  files: string[];
  platform: string;
  arch: string;

  /**
   * Asar configuration
   */
  asar:
    | boolean
    | {
        unpack: string[];
      };

  /**
   * Platform specific options / overrides
   */
  platformOptions?: {
    darwin: PlatformOverrides;
    win32: PlatformOverrides;
    linux: PlatformOverrides;
  };

  /** Rebuild options */
  rebuild: {
    onlyModules?: string[];
  };
};

export async function runElectronPackager(
  options: ElectronPackagerOptions
): Promise<void> {
  const afterCopy = async (
    buildPath: string,
    electronVersion: string,
    platform: string,
    arch: string
  ) => {
    const context = { buildPath, electronVersion, platform, arch };

    await installProductionDeps(context);
    await rebuildNativeModules(options.rebuild, context);
  };

  const afterExtract = async (
    buildPath: string,
    electronVersion: string,
    platform: string,
    arch: string
  ) => {
    const context = { buildPath, electronVersion, platform, arch };

    await Promise.all([
      cleanChromiumLicense(context),
      writeVersionFile(options.version, context),
    ]);
  };

  await electronPackager({
    dir: options.dir,
    out: options.out,
    overwrite: true,
    appCopyright: options.copyright,
    buildVersion: options.version,
    appVersion: options.version,

    // copy all files matched by options.files
    // and ignore everything else
    ignore: (filePath: string) => {
      const patterns = options.files.map((pattern) =>
        path.resolve(options.dir, pattern)
      );

      return !minimatch(filePath, `{${patterns.join(',')}}`, {
        matchBase: true,
      });
    },
    platform: options.platform,
    arch: options.arch,
    asar:
      typeof options.asar === 'boolean' || !options.asar
        ? options.asar
        : {
            unpack: `{${['*.node', '**/vendor/**']
              .concat(options.asar?.unpack || [])
              .join(',')}}`,
          },
    afterCopy: [util.callbackify(afterCopy)],
    afterExtract: [replaceFfmpeg, util.callbackify(afterExtract)],
    name: options.name,
    protocols: [],
    ...((options.platformOptions as any)?.[options.platform] || {}),
  });
}
