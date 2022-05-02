import path from 'path';

import type { ProductConfig } from '../../config/product-config';
import { runElectronPackager } from '../electron-packager/electron-packager';
import type { PackageOptions } from '../package-options';
import { createDeb } from '../packages/deb';
import { createRpm } from '../packages/rpm';
import { createTar } from '../packages/tar';

export async function packageLinux(
  options: PackageOptions,
  productConfig: ProductConfig
): Promise<void> {
  const iconPath = path.resolve(
    __dirname,
    '../../../assets/linux/mongodb-compass.png'
  );

  const packagedAppPath = await runElectronPackager(options, config, {
    icon: iconPath,
  });

  // We append the channel to the package name
  // so we allow multiple version from different channels
  // to be installed on the same system
  const packageNameWithChannel =
    productConfig.channel === 'stable'
      ? productConfig.packageName
      : `${productConfig.packageName}-${productConfig.channel}`;

  await createDeb(
    packagedAppPath,
    iconPath,
    packageNameWithChannel,
    options,
    config
  );

  await createRpm(
    packagedAppPath,
    iconPath,
    packageNameWithChannel,
    options,
    config
  );

  await createTar(packagedAppPath, options, config);
}
