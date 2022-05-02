import path from 'path';
import type { ProductConfig } from '../../config/product-config';
import type { PackageOptions } from '../package-options';
import { signMacApp } from '../sign/sign-mac-app';
import { runElectronPackager } from '../electron-packager/electron-packager';
import { createZip } from '../packages/zip';
import { createDmg } from '../packages/dmg';

export async function packageDarwin(
  options: PackageOptions,
  productConfig: ProductConfig
): Promise<void> {
  const appBundleId = `com.mongodb.${productConfig.distribution.replace(
    /-/g,
    '.'
  )}`;

  const iconPath = path.resolve(
    __dirname,
    '../../../assets/darwin/mongodb-compass.icns'
  );

  const packagedAppPath = await runElectronPackager(options, productConfig, {
    icon: iconPath,
    appBundleId: appBundleId,
    appCategoryType: 'public.app-category.productivity',
  });

  const appPath = path.resolve(
    packagedAppPath,
    `${productConfig.productName}.app`
  );

  if (options.sign) {
    await signMacApp(appPath, {
      bundleId: appBundleId,
      macosEntitlements: path.resolve(
        __dirname,
        '../../../assets/darwin/macos-entitlements.xml'
      ),
    });
  }

  await createDmg(appPath, iconPath, options, productConfig);
  await createZip(appPath, options, productConfig);
}
