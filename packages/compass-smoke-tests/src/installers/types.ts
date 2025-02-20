import type { TestSubject } from '../test-subject';

export type Installer = (pkg: InstallablePackage) => Promise<InstalledAppInfo>;

export type Package = {
  appName: string;
  packageFilepath: string;
  // TODO: once we can download the most recent release
  //releaseFilepath: string;
  installer: Installer;
};

export type InstallablePackage = TestSubject & {
  sandboxPath: string;
};

export type InstalledAppInfo = {
  appPath: string;
  appName: string;
  uninstall: () => void | Promise<void>;
};
