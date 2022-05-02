import { promises as fs } from 'fs';
import path from 'path';

export type PackageJson = {
  name: string;
  version: string;
  files: string[];
  author: {
    name: string;
    email: string;
  };
  license: string;
  engines: Record<string, string>;
  main: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};

export async function readPackageJson(
  packagePath: string
): Promise<PackageJson> {
  const packageJsonString = await fs
    .readFile(path.resolve(packagePath, 'package.json'), 'utf-8')
    .catch((e: Error) => {
      throw new Error(
        `Unable to read package.json in ${packagePath}: ${e.stack || ''}`
      );
    });

  const packageJson = JSON.parse(packageJsonString) as PackageJson;
  return packageJson;
}
