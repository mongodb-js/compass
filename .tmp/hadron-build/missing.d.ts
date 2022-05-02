declare module 'electron-installer-debian' {
  export type DebOptions = {
    src: string;
    dest: string;
    arch: string;
    /**
     * @example './linux/my-app.png';
     */

    icon: string;
    /**
     * @example 'my-app-dev';
     */
    name: string;

    /**
     * @example '1.2.3~dev.0';
     */
    version: string;

    /**
     * @example 'My App Dev';
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

    rename: (dest: string, file: string) => string;
  };

  function electronInstallerDebian(options: DebOptions): Promise<void>;

  export default electronInstallerDebian;
}

declare module 'electron-installer-redhat' {
  export type RpmOptions = {
    /**
     * @example './dist/My App-linux-x64'
     */
    src: string;

    /**
     * @example './dist'
     */
    dest: string;

    /**
     * @example 'x86_64'
     */
    arch: string;

    /**
     * @example './linux/my-app.png'
     */
    icon: string;

    /**
     * @example 'my-app-dev'
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
     * @example 'My App Dev'
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
     * @example 'MIT'
     */
    license: string;

    rename: (dest: string, file: string) => string;
  };

  function electronInstallerRedhat(options: RpmOptions): Promise<void>;

  export default electronInstallerRedhat;
}

declare module '@mongodb-js/mongodb-notary-service-client' {
  function sign(src: string): Promise<void>;
  export default sign;
}
