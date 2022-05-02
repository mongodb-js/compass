// eslint-disable-next-line @typescript-eslint/no-var-requires
const electronInstallerDebian = require('electron-installer-debian');
import type { ProductConfig } from '../../config/product-config';
import type { PackageOptions } from '../package-options';

export async function createDeb(
  packagedAppPath: string,
  iconPath: string,
  packageNameWithChannel: string,
  options: PackageOptions,
  productConfig: ProductConfig
): Promise<void> {
  if (!options.packages.has('deb')) {
    console.info('Deb missing in options. Skipping ...');
    return;
  }

  if (options.arch !== 'x64') {
    throw new Error(`Unsupported architecture ${options.arch}`);
  }

  const debOptions = {
    src: packagedAppPath,
    dest: options.paths.dest,
    arch: 'amd64',
    icon: iconPath,
    description: productConfig.description,
    name: packageNameWithChannel,
    version: productConfig.version.replace('-', '~'),
    bin: productConfig.productName,
    section: 'Databases',
    depends: ['libsecret-1-0', 'gnome-keyring', 'libgconf-2-4'],
  };

  console.info('Building Deb with options', debOptions);
  await electronInstallerDebian(debOptions);
  console.info('Deb built');
}
