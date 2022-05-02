import type { Paths } from '../config/paths';

export type Platform = 'darwin' | 'linux' | 'win32';

export type PackageOptions = {
  paths: Paths;
  distribution: string;
  compile: boolean;
  arch: typeof process.arch;
  sign: boolean;
  asar: boolean;
  prepare: boolean;
  packages: Set<string>;
  platform: Platform;
};
