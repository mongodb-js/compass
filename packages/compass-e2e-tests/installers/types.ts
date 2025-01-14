export type Installer = (pkg: InstallablePackage) => Promise<InstalledAppInfo>;

export type Package = {
  appName: string;
  packageFilepath: string;
  // TODO(COMPASS-8532): once we can download the most recent release
  //releaseFilepath: string;
  updatable: boolean;
  installer: Installer;
};

export type InstallablePackage = {
  appName: string;
  filepath: string;
};

export type InstalledAppInfo = {
  appPath: string;
  uninstall: () => Promise<void>;
};
