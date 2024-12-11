#!/usr/bin/env npx ts-node
import yargs from 'yargs';
import type { Argv } from 'yargs';
import { hideBin } from 'yargs/helpers';

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
  })
  .scriptName('smoke-tests')
  .detectLocale(false)
  .version(false)
  .strict()
  .option('skip-download', {
    type: 'boolean',
    description: "Don't download all assets before starting",
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

  //
}

run()
  .then(function () {
    console.log('done');
  })
  .catch(function (err) {
    console.error(err.stack);
    process.exit(1);
  });

// for later (once we can test upgrading TO this version), which channel are we on? dev, beta or staging

// params needed for downloading all the assets
// EVERGREEN_BUCKET_NAME: mciuploads
// EVERGREEN_BUCKET_KEY_PREFIX: ${project}/${revision}_${revision_order_id}
// npm run --workspace mongodb-compass download

// use build-info to get the info about the files
// npm run --workspace mongodb-compass build-info

// from print-compass-env.sh
/*
IS_WINDOWS
IS_OSX
IS_UBUNTU
IS_RHEL
*/

/*
// expansions are from apply-compass-target-expansion func
// or npm run --workspace mongodb-compass build-info -- --format=yaml --flatten --out expansions.raw.yml
// env vars have to be set from that output somehow
WINDOWS_EXE_NAME: ${windows_setup_filename}
WINDOWS_MSI_NAME: ${windows_msi_filename}
WINDOWS_ZIP_NAME: ${windows_zip_filename}
WINDOWS_NUPKG_NAME: ${windows_nupkg_full_filename}

OSX_DMG_NAME: ${osx_dmg_filename}
OSX_ZIP_NAME: ${osx_zip_filename}

RHEL_RPM_NAME: ${linux_rpm_filename}
RHEL_TAR_NAME: ${rhel_tar_filename}

LINUX_DEB_NAME: ${linux_deb_filename}
LINUX_TAR_NAME: ${linux_tar_filename}
*/

/*
- &get-artifact-params
aws_key: ${aws_key}
aws_secret: ${aws_secret}
bucket: mciuploads
content_type: application/octet-stream


// see get-all-artifacts

EVERGREEN_BUCKET_NAME: mciuploads
EVERGREEN_BUCKET_KEY_PREFIX: ${project}/${revision}_${revision_order_id}

npm run --workspace mongodb-compass download

// takes dir and version

can also be used with generateVersionsForAssets to figure out the download links for beta/stable if we have the version
*/
