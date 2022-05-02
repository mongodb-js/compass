import type { CreateOptions } from 'electron-installer-dmg';
import path from 'path';
import type { ProductConfig } from '../../config/product-config';
import type { PackageOptions } from '../package-options';
import dmg from 'electron-installer-dmg';

export async function createDmg(
  appPath: string,
  iconPath: string,
  options: PackageOptions,
  productConfig: ProductConfig
): Promise<void> {
  if (!options.packages.has('dmg')) {
    console.info('Dmg missing in options. Skipping ...');
    return;
  }

  const dmgFileName = `${productConfig.packageName}-${productConfig.version}-${options.platform}-${options.arch}.dmg`;
  const dmgOptions: CreateOptions & { dmgPath: string } = {
    // NOTE: dmgPath is used in electron-installer-dmg, but
    // missing in @types/electron-installer-dmg
    dmgPath: path.resolve(options.paths.dest, dmgFileName),
    name: productConfig.productName,
    title: productConfig.productName,
    overwrite: true,
    icon: iconPath,
    appPath: appPath,
    background: path.resolve(
      __dirname,
      '../../../assets/darwin/background.png'
    ),
    contents: [
      {
        x: 322,
        y: 243,
        type: 'link',
        path: '/Applications',
      },
      {
        x: 93,
        y: 243,
        type: 'file',
        path: appPath,
      },
    ],
  };

  console.info('Building DMG', dmgOptions);
  await dmg(dmgOptions as CreateOptions);
}
