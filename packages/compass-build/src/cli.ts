import { program, Option, Argument, Command } from 'commander';
import path from 'path';
import { getPackagePaths } from './config/paths';
import { packageCompass } from './package/package';
import { rebuildNativeModules } from './package/prepare';

const DARWIN_PACKAGE_TYPES = ['zip', 'dmg'];
const WIN32_PACKAGE_TYPES = ['zip', 'msi', 'exe'];
const LINUX_PACKAGE_TYPES = ['tar', 'deb', 'rpm'];

const ANY_PACKAGE_TYPE_SET = new Set([
  ...DARWIN_PACKAGE_TYPES,
  ...WIN32_PACKAGE_TYPES,
  ...LINUX_PACKAGE_TYPES,
]);

export type PackageCliOptions = {
  distribution: string;
  platform: typeof process.platform;
  packages: string[];
  prepare: boolean;
  compile: boolean;
  arch: typeof process.arch;
  sign: boolean;
  asar: boolean;
};

async function runPackage(sourcePath: string, options: PackageCliOptions) {
  sourcePath = path.resolve(sourcePath);

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

  const unsupportedPlatformPackages = [...packages].filter(
    (x) => !allPlatformPackages.has(x)
  );

  if (unsupportedPlatformPackages.length) {
    throw new Error(
      `${[...unsupportedPlatformPackages].join(', ')} not supported for ${
        options.platform
      }`
    );
  }

  await packageCompass({
    paths: getPackagePaths(sourcePath),
    distribution: options.distribution,
    compile: options.compile,
    prepare: options.prepare,
    arch: options.arch,
    sign: options.sign,
    asar: options.asar,
    platform: options.platform,
    packages,
  });
}

async function main() {
  const packageCommand = new Command('package')
    .addArgument(
      new Argument('[sourcePath]', 'Path of the compass package').default(
        process.cwd(),
        'process.cwd()'
      )
    )
    .addOption(
      new Option(
        '-d, --distribution <distribution>',
        'The Compass distribution to build'
      )
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
    .addOption(
      new Option(
        '--no-prepare',
        "Don't recreate the input directory for electron packager"
      )
    )
    .addOption(new Option('--no-sign', "Don't sign the artifacts produced"))
    .addOption(
      new Option('--no-asar', "Don't archive the application files with asar")
    )
    .action(runPackage);

  const uploadCommand = new Command('upload').addArgument(
    new Argument('[sourcePath]', 'Path of the compass package').default(
      process.cwd(),
      'process.cwd()'
    )
  );

  const rebuildCommand = new Command('rebuild')
    .addArgument(
      new Argument('[sourcePath]', 'Path of the compass package').default(
        process.cwd(),
        'process.cwd()'
      )
    )
    .addOption(
      new Option('--project-root-path [projectRootPath]', 'Project root path')
    )
    .action(rebuildNativeModules);

  program.addCommand(packageCommand);
  program.addCommand(uploadCommand);
  program.addCommand(rebuildCommand);

  await program.parseAsync(process.argv);
}

main().then(() => {
  console.log('done');
}, console.error);
