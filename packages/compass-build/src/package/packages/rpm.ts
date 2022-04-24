import which from 'which';

export type RpmOptions = {
  /**
   * @example '<%= compassPackagePath %>/dist/MongoDB Compass Dev-linux-x64'
   */
  src: string;

  /**
   * @example '<%= compassPackagePath %>/dist'
   */
  dest: string;

  /**
   * @example 'x86_64'
   */
  arch: string;

  /**
   * @example '<%= compassPackagePath %>/app-icons/linux/mongodb-compass.png'
   */
  icon: string;

  /**
   * @example 'mongodb-compass-dev'
   */
  name: string;

  /**
   * @example '1.2.3'
   */
  version: string;

  /**
   * @example 'dev.0'
   */
  revision: string;

  /**
   * @example 'MongoDB Compass Dev'
   */
  bin: string;

  /**
   * @example [ 'lsb-core-noarch', 'libXScrnSaver', 'gnome-keyring', 'libsecret', 'GConf2' ]
   *
   */
  requires: string[];

  /**
   * @example   categories: [ 'Office', 'Database' ]
   */
  categories: string[];

  /**
   * @example 'SSPL'
   */
  license: string;
};

export async function rpm(options: RpmOptions): Promise<void> {
  if (!(await which('rpmbuild').catch(() => false))) {
    throw new Error(`Cannot create rpm, rpmbuild is missing`);
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const createRpm = require('electron-installer-redhat');

  await createRpm(options);
}
