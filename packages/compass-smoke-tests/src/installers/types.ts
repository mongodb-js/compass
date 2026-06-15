import type { TestSubject } from '../test-subject';

type Installer = (pkg: InstallablePackage) => Promise<InstalledAppInfo>;

type Package = {
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
