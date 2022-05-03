import { promises as fs } from 'fs';
import cpy from 'cpy';
import path from 'path';
import execa from 'execa';
import type { PackageOptions } from './package-options';
import type { ProductConfig } from '../config/product-config';
import { rebuildNativeModules } from '../rebuild-native-modules/rebuild-native-modules';

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
        main: productConfig.packageJson.main,
        engines: productConfig.packageJson.engines,
        dependencies: productConfig.packageJson.dependencies,
        devDependencies: {
          electron: productConfig.packageJson.devDependencies?.electron,
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
