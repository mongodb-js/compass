import path from 'path';
import { promises as fs } from 'fs';
import type { ProductConfig } from '../../config/product-config';
import type { PackageOptions } from '../package-options';
import { signWindowsPackage } from '../sign/sign-windows-package';
import type { MSICreatorOptions } from '@mongodb-js/electron-wix-msi';
import { MSICreator } from '@mongodb-js/electron-wix-msi';

export async function createMsi(
  packagedAppPath: string,
  productNameWithoutSpaces: string,
  options: PackageOptions,
  productConfig: ProductConfig
): Promise<void> {
  if (!options.packages.has('msi')) {
    console.info('Msi missing in options. Skipping ...');
    return;
  }

  if (options.arch !== 'x64') {
    throw new Error(`Unsupported architecture ${options.arch}`);
  }

  const msiOptions: MSICreatorOptions = {
    appDirectory: packagedAppPath,
    outputDirectory: options.paths.dest,
    exe: productNameWithoutSpaces,
    name: productConfig.productName,
    description: productConfig.description,
    manufacturer: productConfig.companyName,
    version: [
      productConfig.semver.major,
      productConfig.semver.minor,
      productConfig.semver.patch,
      productConfig.semver.prerelease[1] || '0',
    ].join('.'),
    shortcutFolderName: 'MongoDB',
    programFilesFolderName: productConfig.productName,
    appUserModelId: `com.mongodb.${productConfig.distribution.replace(
      /-/g,
      '.'
    )}`,
    upgradeCode: productConfig.msiUpgradeCode,
    arch: 'x64',
    extensions: ['WixUtilExtension'],
    ui: {
      chooseDirectory: true,
      images: {
        background: path.resolve(
          __dirname,
          '../../../assets/win32/background.jpg'
        ),
        banner: path.resolve(__dirname, '../../../assets/win32/banner.jpg'),
      },
    },
  };

  console.info('Creating windows MSI installer', msiOptions);

  const msiCreator = new MSICreator(msiOptions);

  await msiCreator.create();
  await msiCreator.compile();

  const finalMsiPath = path.resolve(
    options.paths.dest,
    `${productConfig.packageName}-${productConfig.version}-${options.platform}-${options.arch}.msi`
  );

  await fs.rename(
    path.resolve(options.paths.dest, `${productNameWithoutSpaces}.msi`),
    finalMsiPath
  );

  if (options.sign) {
    // sign the MSI
    signWindowsPackage(finalMsiPath);
  }

  console.info('Windows MSI installer created');
}
