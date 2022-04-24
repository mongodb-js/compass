import which from 'which';

export type DebOptions = {
  src: string;
  dest: string;
  arch: string;
  /**
   * @example '<%= compassPackagePath %>/app-icons/linux/mongodb-compass.png';
   */

  icon: string;
  /**
   * @example 'mongodb-compass-dev';
   */
  name: string;

  /**
   * @example '1.2.3~dev.0';
   */
  version: string;

  /**
   * @example 'MongoDB Compass Dev';
   */
  bin: string;

  /**
   * @example 'Databases'
   */
  section: string;

  /**
   * @example ['libsecret-1-0', 'gnome-keyring', 'libgconf-2-4']
   */
  depends: string[];
};

export async function deb(options: DebOptions): Promise<void> {
  if (!(await which('fakeroot').catch(() => false))) {
    throw new Error(`Cannot create deb, fakeroot is missing`);
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const electronInstallerDebian = require('electron-installer-debian');

  await electronInstallerDebian(options);
}
