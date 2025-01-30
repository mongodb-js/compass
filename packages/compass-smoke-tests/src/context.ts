import { type PackageKind } from './packages';
import { type TestName } from './tests/types';

export type SmokeTestsContext = {
  bucketName?: string;
  bucketKeyPrefix?: string;
  platform: 'win32' | 'darwin' | 'linux';
  arch: 'x64' | 'arm64';
  package: PackageKind;
  forceDownload?: boolean;
  localPackage?: boolean;
  sandboxPath: string;
  tests: TestName[];
  skipCleanup: boolean;
};
