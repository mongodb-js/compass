import path from 'path';

import type { ProductConfig } from '../../config/product-config';
import { runElectronPackager } from '../electron-packager/electron-packager';
import type { PackageOptions } from '../package-options';
import { signWindowsPackage } from '../sign/sign-windows-package';
import { createZip } from '../packages/zip';
import { createMsi } from '../packages/msi';
import { createSetupExe } from '../packages/exe';

export async function packageWin32(
  options: PackageOptions,
  productConfig: ProductConfig
): Promise<void> {
  const productNameWithoutSpaces = productConfig.productName.replace(/ /g, '');

  const packagedAppPath = await runElectronPackager(options, config, {
    name: productNameWithoutSpaces,
    icon: path.resolve(__dirname, '../../../assets/win32/mongodb-compass.ico'),
    win32metadata: {
      CompanyName: productConfig.companyName,
      FileDescription: productConfig.description,
      ProductName: productConfig.productName,
      InternalName: productConfig.packageName,
    },
  });

  if (options.sign) {
    // sign the main application .exe
    signWindowsPackage(
      path.resolve(packagedAppPath, `${productNameWithoutSpaces}.exe`)
    );
  }

  await createSetupExe(
    packagedAppPath,
    productNameWithoutSpaces,
    options,
    config
  );

  await createMsi(packagedAppPath, productNameWithoutSpaces, options, config);
  await createZip(packagedAppPath, options, config);
}
