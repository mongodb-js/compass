import { type PackageKind } from './packages';

export type SmokeTestsContext = {
  bucketName?: string;
  bucketKeyPrefix?: string;
  platform: 'win32' | 'darwin' | 'linux';
  arch: 'x64' | 'arm64';
  package: PackageKind;
  forceDownload?: boolean;
  localPackage?: boolean;
  sandboxPath: string;
  tests: string[];
};
