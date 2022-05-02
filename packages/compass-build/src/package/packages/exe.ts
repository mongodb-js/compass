import path from 'path';
import { promises as fs } from 'fs';
import type { ProductConfig } from '../../config/product-config';
import type { PackageOptions } from '../package-options';
import { createWindowsInstaller } from 'electron-winstaller';

export async function createSetupExe(
  packagedAppPath: string,
  productNameWithoutSpaces: string,
  options: PackageOptions,
  productConfig: ProductConfig
): Promise<void> {
  if (!options.packages.has('exe')) {
    console.info('Exe missing in options. Skipping Setup.exe ...');
    return;
  }

  const installerOptions = {
    loadingGif: path.resolve(
      __dirname,
      '../../../assets/win32/mongodb-compass-installer-loading.gif'
    ),
    iconUrl: 'https://compass.mongodb.com/favicon.ico',
    appDirectory: packagedAppPath,
    outputDirectory: options.paths.dest,
    authors: productConfig.companyName,
    version: productConfig.version,
    exe: `${productNameWithoutSpaces}.exe`,
    setupExe: `${productConfig.packageName}-${productConfig.version}-${options.platform}-${options.arch}.exe`,
    title: productConfig.productName,
    productName: productConfig.productName,
    description: productConfig.description,
    name: productNameWithoutSpaces,
    noMsi: true,

    // This setting will prompt winstaller to try to sign files
    // for the installer with signtool.exe
    //
    // The intended use is to pass custom flags for the signtool.exe bundled
    // inside winstaller.
    //
    // We replace signtool.exe with an "emulated version" that is signing files
    // via notary service in the postinstall script.
    //
    // Here we just set any parameter so that signtool.exe is invoked if signing
    // is enabled.
    //
    // @see https://jira/mongodb.org/browse/BUILD-920
    signWithParams: options.sign ? 'sign' : undefined,
  };

  console.info('Creating windows EXE installer', installerOptions);
  await createWindowsInstaller(installerOptions);

  // Since we will upload multiple "RELEASES" file for different distribution
  // we are going to rename the file so that there is no conflict  and
  // the auto update server will be able to pick the right one.
  await fs.rename(
    path.resolve(options.paths.dest, 'RELEASES'),
    path.resolve(options.paths.dest, `${productConfig.distribution}-RELEASES`)
  );

  console.info('Windows EXE installer created');
}
