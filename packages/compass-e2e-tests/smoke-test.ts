#!/usr/bin/env npx ts-node
import yargs from 'yargs';
import type { Argv } from 'yargs';
import { hideBin } from 'yargs/helpers';
import { promises as fs } from 'fs';
import { handler as writeBuildInfo } from 'hadron-build/commands/info';
import { run as downloadPackages } from 'hadron-build/commands/download';

const argv = yargs(hideBin(process.argv))
  .middleware((argv) => {
    if (process.env.EVERGREEN_BUCKET_NAME) {
      argv.bucketName = process.env.EVERGREEN_BUCKET_NAME;
    }
    if (process.env.EVERGREEN_BUCKET_KEY_PREFIX) {
      argv.bucketKeyPrefix = process.env.EVERGREEN_BUCKET_KEY_PREFIX;
    }

    argv.isWindows = process.env.IS_WINDOWS === 'true';
    argv.isOSX = process.env.IS_OSX === 'true';
    argv.isRHEL = process.env.IS_RHEL === 'true';
    argv.isUbuntu = process.env.IS_UBUNTU === 'true';
    if (process.arch) {
      argv.arch = process.env.ARCH;
    }
  })
  .scriptName('smoke-tests')
  .detectLocale(false)
  .version(false)
  .strict()
  .option('arch', {
    type: 'string',
    choices: ['x64', 'arm64'],
    default: () => {
      process.arch;
    },
  })
  .option('skip-download', {
    type: 'boolean',
    description: "Don't download all assets before starting",
  })
  .option('extension', {
    type: 'string',
    description:
      'If specified it will only run the smoke tests for the specified installer/package',
  })
  .check((argv) => {
    if (!argv.skipDownload) {
      if (!(argv.bucketName && argv.bucketKeyPrefix)) {
        throw new Error(
          'Either supply EVERGREEN_BUCKET_NAME and EVERGREEN_BUCKET_KEY_PREFIX or specify --skip-download'
        );
      }
    }

    if (!(argv.isWindows || argv.isOSX || argv.isUbuntu || argv.isRHEL)) {
      throw new Error(
        'Set at least one of IS_WINDOWS, IS_OSX, IS_UBUNTU, IS_RHEL'
      );
    }

    if (!argv.arch) {
      throw new Error('Please provice ARCH (x64 or arm64)');
    }

    return true;
  });

type BuilderCallbackParsedArgs<A extends (...args: any[]) => Argv<any>> =
  ReturnType<ReturnType<A>['parseSync']>;

type SmokeTestsContext = BuilderCallbackParsedArgs<typeof argv>;

async function run() {
  const parsedArgs = argv.parse();

  if ('then' in parsedArgs && typeof parsedArgs.then === 'function') {
    throw new Error('Async args parser is not allowed');
  }

  const context = parsedArgs as SmokeTestsContext;

  console.log(context);

  if (!context.skipDownload) {
    // download
  }

  // build-info
  const infoArgs = {
    format: 'json',
    // TODO
    dir: '',
    version: '',
    platform: '',
    arch: '',
    out: '',
  };
  writeBuildInfo(infoArgs);

  // read the file
  const buildInfo = JSON.parse(await fs.readFile(infoArgs.out, 'utf8'));

  // filter the extensions given the platform (isWindows, isOSX, isUbuntu, isRHEL) and extension
  const { isWindows, isOSX, isRHEL, isUbuntu, extension } = context;

  const filenames = filterPackages(buildInfo, {
    isWindows,
    isOSX,
    isRHEL,
    isUbuntu,
    extension,
  });

  // loop through the remaining filenames and install each then run the tests
  for (const filename of filenames) {
  }
}

type PackageFilterConfig = Pick<
  SmokeTestsContext,
  'isWindows' | 'isOSX' | 'isRHEL' | 'isUbuntu' | 'extension'
>;

type WindowsBuildInfo = {
  windows_setup_filename: string;
  windows_msi_filename: string;
  windows_zip_filename: string;
  windows_nupkg_full_filename: string;
};

type OSXBuildInfo = {
  osx_dmg_filename: string;
  osx_zip_filename: string;
};

type UbuntuBuildInfo = {};

type RHELBuildInfo = {};

function buildInfoIsWindows(buildInfo: any): buildInfo is WindowsBuildInfo {}

function buildInfoIsOSX(buildInfo: any): buildInfo is OSXBuildInfo {}

function buildInfoIsUbuntu(buildInfo: any): buildInfo is UbuntuBuildInfo {}

function buildInfoIsRHEL(buildInfo: any): buildInfo is RHELBuildInfo {}

function filterPackages(buildInfo: any, config: PackageFilterConfig) {
  if (config.isWindows) {
    if (!buildInfoIsWindows(buildInfo)) {
      throw new Error('missing windows package keys');
    }
  } else if (config.isOSX) {
    if (!buildInfoIsOSX(buildInfo)) {
      throw new Error('missing osx package keys');
    }
  } else if (config.isRHEL) {
    if (!buildInfoIsOSX(buildInfo)) {
      throw new Error('missing rhel package keys');
    }
  } else if (config.isUbuntu) {
    if (!buildInfoIsOSX(buildInfo)) {
      throw new Error('missing ubuntu package keys');
    }
  }
}

run()
  .then(function () {
    console.log('done');
  })
  .catch(function (err) {
    console.error(err.stack);
    process.exit(1);
  });
