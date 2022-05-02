import path from 'path';
import type { ProductConfig } from '../../config/product-config';
import type { PackageOptions } from '../package-options';
import { zip } from 'zip-a-folder';

export async function createZip(
  appPath: string,
  options: PackageOptions,
  productConfig: ProductConfig
): Promise<void> {
  if (!options.packages.has('zip')) {
    console.info('Zip missing in options. Skipping ...');
    return;
  }

  const zipFileName = `${productConfig.packageName}-${productConfig.version}-${options.platform}-${options.arch}.zip`;
  const zipPath = path.resolve(options.paths.dest, zipFileName);

  console.info('Building Zip', { appPath, zipPath });
  await zip(appPath, zipPath);
}
