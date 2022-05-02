// eslint-disable-next-line @typescript-eslint/no-var-requires
const electronInstallerRedhat = require('electron-installer-redhat');
import type { ProductConfig } from '../../config/product-config';
import type { PackageOptions } from '../package-options';

export async function createRpm(
  packagedAppPath: string,
  iconPath: string,
  packageNameWithChannel: string,
  options: PackageOptions,
  productConfig: ProductConfig
): Promise<void> {
  if (!options.packages.has('rpm')) {
    console.info('Rpm missing in options. Skipping ...');
    return;
  }

  if (options.arch !== 'x64') {
    throw new Error(`Unsupported architecture ${options.arch}`);
  }

  const [version, revision] = productConfig.version.split('-');

  const rpmOptions = {
    src: packagedAppPath,
    dest: options.paths.dest,
    arch: 'x86_64',
    icon: iconPath,
    name: packageNameWithChannel,
    description: productConfig.description,
    productDescripiton: productConfig.description,
    version: version,
    revision: revision || '1',
    bin: productConfig.productName,
    requires: [
      'lsb-core-noarch',
      'libXScrnSaver',
      'gnome-keyring',
      'libsecret',
      'GConf2',
    ],
    categories: [
      'Office',
      'Database',
      'Building',
      'Debugger',
      'IDE',
      'GUIDesigner',
      'Profiling',
    ],
    license: productConfig.packageJson.license,
  };

  console.info('Building Rpm with options', rpmOptions);
  await electronInstallerRedhat(rpmOptions);
  console.info('Rpm built');
}
