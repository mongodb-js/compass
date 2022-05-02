import { promises as fs } from 'fs';
import cpy from 'cpy';
import path from 'path';
import { rebuild } from 'electron-rebuild';
import execa from 'execa';
import type { PackageOptions } from './package-options';
import type { ProductConfig } from '../config/product-config';

export async function preparePackagerSrc(
  options: PackageOptions,
  productConfig: ProductConfig
): Promise<void> {
  if (!options.paths.packagerSrc) {
    throw new Error('a destination folder is required');
  }

  if (options.paths.packagerSrc === options.paths.src) {
    throw new Error('the destination folder must be different from source');
  }

  await fs.rm(options.paths.packagerSrc, { recursive: true, force: true });
  await fs.mkdir(options.paths.packagerSrc, { recursive: true });

  await cpy(productConfig.packageJson.files, options.paths.packagerSrc, {
    cwd: options.paths.src,
    parents: true,
  });

  await fs.writeFile(
    path.resolve(options.paths.packagerSrc, 'package.json'),
    JSON.stringify(
      {
        name: productConfig.packageJson.name,
        version: productConfig.packageJson.version,
        description: productConfig.description,
        private: true,
        // scripts: {
        //   'electron-rebuild':
        //     'electron-rebuild --only kerberos,keytar,interruptor,os-dns-native,win-export-certificate-and-key,macos-export-certificate-and-key --force --prebuild-tag-prefix not-real-prefix-to-force-rebuild',
        // },
        main: productConfig.packageJson.main,
        engines: productConfig.packageJson.engines,
        dependencies: productConfig.packageJson.dependencies,
        devDependencies: {
          electron: productConfig.packageJson.devDependencies?.electron,
          // 'electron-rebuild':
          // productConfig.packageJson.devDependencies?.['electron-rebuild'],
        },
      },
      null,
      2
    )
  );

  await installProductionDeps({ buildPath: options.paths.packagerSrc });
  await rebuildNativeModules(options.paths.packagerSrc, {
    projectRootPath: undefined,
  });
}

async function getElectronVersion(dest: string): Promise<string> {
  return JSON.parse(
    await fs.readFile(
      require.resolve('electron/package.json', { paths: [dest] }),
      'utf-8'
    )
  ).version;
}

async function installProductionDeps(context: {
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

export async function rebuildNativeModules(
  buildPath: string,
  options: { projectRootPath?: string }
): Promise<void> {
  buildPath = path.resolve(buildPath);

  console.info('Rebuilding native modules', { buildPath, options });

  const electronVersion = await getElectronVersion(buildPath);
  process.env.npm_config_napi_build_version = '7';

  await rebuild({
    onlyModules: [
      'interruptor',
      'keytar',
      'kerberos',
      'os-dns-native',
      'win-export-certificate-and-key',
      'macos-export-certificate-and-key',
    ],
    electronVersion: electronVersion,
    buildPath: buildPath,
    // `projectRootPath` is undocumented, but changes modules resolution quite
    // a bit and required for the electron-rebuild to be able to pick up
    // dependencies inside project root, but outside of their dependants (e.g.
    // a transitive dependency that was hoisted by npm installation process)
    projectRootPath: options.projectRootPath
      ? path.resolve(buildPath, options.projectRootPath)
      : undefined,
    force: true,
    // We want to ensure that we are actually rebuilding native modules on the
    // platform we are packaging. There is currently no direct way of passing a
    // --build-from-source flag to rebuild-install package, but we can force
    // rebuild by providing a tag prefix that will make prebuild think that
    // prebuilt files don't exist
    prebuildTagPrefix: 'totally-not-a-real-prefix-to-force-rebuild',
  });
}
