import path from 'path';
import { tar } from 'zip-a-folder';
import type { ProductConfig } from '../../config/product-config';
import type { PackageOptions } from '../package-options';

export async function createTar(
  packagedAppPath: string,
  options: PackageOptions,
  productConfig: ProductConfig
): Promise<void> {
  if (!options.packages.has('tar')) {
    console.info('Tar missing in options. Skipping ...');
    return;
  }

  const tarFileName = `${productConfig.packageName}-${productConfig.version}-${options.platform}-${options.arch}.tar.gz`;
  const tarPath = path.resolve(options.paths.dest, tarFileName);

  await tar(packagedAppPath, tarPath);
}
