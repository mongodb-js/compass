export type Installer = (pkg: InstallablePackage) => Promise<InstalledAppInfo>;

export type Package = {
  appName: string;
  packageFilepath: string;
  // TODO: once we can download the most recent release
  //releaseFilepath: string;
  installer: Installer;
};

export type InstallablePackage = {
  appName: string;
  filepath: string;
  destinationPath: string;
};

export type InstalledAppInfo = {
  appPath: string;
  uninstall: () => Promise<void>;
};
