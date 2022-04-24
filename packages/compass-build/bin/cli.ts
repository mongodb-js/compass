import { program, Option, Argument } from 'commander';
import path from 'path';

import { promises as fs } from 'fs';

import type {
  DarwinPackageType,
  Win32PackageType,
  LinuxPackageType,
  CompassDistribution,
  PackageType,
} from '../src/package/package';
import { packageCompass } from '../src/package/package';

const DARWIN_PACKAGE_TYPES: Set<DarwinPackageType> = new Set(['zip', 'dmg']);
const WIN32_PACKAGE_TYPES: Set<Win32PackageType> = new Set([
  'zip',
  'msi',
  'exe',
]);

const LINUX_PACKAGE_TYPES: Set<LinuxPackageType> = new Set([
  'tar',
  'deb',
  'rpm',
]);

const ANY_PACKAGE_TYPE_SET = new Set([
  ...DARWIN_PACKAGE_TYPES,
  ...WIN32_PACKAGE_TYPES,
  ...LINUX_PACKAGE_TYPES,
]);

export type PackageCliOptions = {
  distribution: CompassDistribution;
  platform: typeof process.platform;
  packages: PackageType[] | null;
  compile: boolean;
  arch: typeof process.arch;
  sign: boolean;
  asar: boolean;
};

async function run(sourcePath: string, options: PackageCliOptions) {
  const packagesByPlatform = {
    darwin: DARWIN_PACKAGE_TYPES,
    win32: WIN32_PACKAGE_TYPES,
    linux: LINUX_PACKAGE_TYPES,
  };

  if (
    options.platform !== 'linux' &&
    options.platform !== 'darwin' &&
    options.platform !== 'win32'
  ) {
    throw new Error(`Unsupported platform ${options.platform}`);
  }

  const allPlatformPackages = new Set(packagesByPlatform[options.platform]);
  const packages = new Set(options.packages || [...allPlatformPackages]);

  const unsupportedPlatformPackages = new Set(
    [...packages].filter((x) => !allPlatformPackages.has(x))
  );

  if (unsupportedPlatformPackages.size) {
    throw new Error(
      `${[...unsupportedPlatformPackages].join(', ')} not supported for ${
        options.platform
      }`
    );
  }

  await validateSourcePath(sourcePath);

  await packageCompass({
    sourcePath: path.resolve(sourcePath),
    distribution: options.distribution,
    compile: options.compile,
    arch: options.arch,
    sign: options.sign,
    asar: options.asar,
    platform: options.platform,
    packages: packages as
      | Set<LinuxPackageType>
      | Set<DarwinPackageType>
      | Set<Win32PackageType>,
  });
}

async function validateSourcePath(sourcePath: string) {
  const packageJsonContent = await fs
    .readFile(path.resolve(sourcePath, 'package.json'), 'utf-8')
    .catch((e: Error) => {
      throw new Error(
        `Unable to read package.json in ${sourcePath}: ${e.stack || ''}`
      );
    });

  const packageJson = JSON.parse(packageJsonContent);

  if (packageJson.name !== 'mongodb-compass') {
    throw new Error(
      `The package name in ${sourcePath} is not 'mongodb-compass' as expected`
    );
  }
}

async function main() {
  program
    .addArgument(
      new Argument('<sourcePath>', 'Path of the compass package').default(
        process.cwd()
      )
    )
    .addOption(
      new Option('[distribution]', 'The Compass distribution to build')
        .choices(['compass', 'compass-isolated', 'compass-readonly'])
        .default('compass')
    )
    .addOption(
      new Option('--platform <platform>', 'One or more platform to build')
        .choices(['darwin', 'win32', 'linux'])
        .default(process.platform, 'process.platform')
    )
    .addOption(
      new Option('--arch <arch>', 'One or more platform to build')
        .choices(['darwin', 'win32', 'linux'])
        .default(process.arch, 'process.arch')
    )
    .addOption(
      new Option('--packages <packages...>', 'One or more packages to build')
        .choices([...ANY_PACKAGE_TYPE_SET])
        .default(null, 'all the packages for the choosen platform')
    )
    .addOption(
      new Option(
        '--no-compile',
        "Don't compile/recompile the application source"
      )
    )
    .addOption(new Option('--no-sign', "Don't sign the artifacts produced"))
    .addOption(
      new Option('--no-asar', "Don't archive the application files with asar")
    )
    .action(run);

  await program.parseAsync(process.argv);
}

main().then(() => {
  console.log('done');
}, console.error);
