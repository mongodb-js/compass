import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import createDebug from 'debug';
import { pick } from 'lodash';

import { handler as writeBuildInfo } from 'hadron-build/commands/info';

import { type PackageKind } from './packages';
import { type SmokeTestsContextWithSandbox } from './context';

const debug = createDebug('compass:smoketests:build-info');
const COMPASS_PATH = path.resolve(__dirname, '../../compass');

const SUPPORTED_CHANNELS = ['dev', 'beta', 'stable'] as const;

export type Channel = typeof SUPPORTED_CHANNELS[number];

function assertObjectHasKeys<
  Keys extends readonly string[],
  Obj extends Record<Keys[number], unknown>
>(obj: unknown, name: string, keys: Keys): asserts obj is Obj {
  assert(
    typeof obj === 'object' && obj !== null,
    `Expected ${name} to be an object`
  );

  for (const key of keys) {
    assert(key in obj, `Expected '${name}' to have '${key}'`);
  }
}

// subsets of the hadron-build info result

export const commonKeys = ['productName', 'version', 'channel'] as const;
export type CommonBuildInfo = Record<typeof commonKeys[number], string> & {
  channel: Channel;
};

export function assertCommonBuildInfo(
  buildInfo: unknown
): asserts buildInfo is CommonBuildInfo {
  assertObjectHasKeys(buildInfo, 'buildInfo', commonKeys);
  assert(
    SUPPORTED_CHANNELS.includes(buildInfo.channel as Channel),
    `Expected ${JSON.stringify(
      buildInfo.channel
    )} to be in ${SUPPORTED_CHANNELS.join(',')}`
  );
}

export const windowsFilenameKeys = [
  'windows_setup_filename',
  'windows_msi_filename',
  'windows_zip_filename',
  'windows_nupkg_full_filename',
] as const;
export type WindowsBuildInfo = CommonBuildInfo &
  Record<typeof windowsFilenameKeys[number], string> & {
    installerOptions: {
      name: string;
    };
  };

export function assertBuildInfoIsWindows(
  buildInfo: unknown
): asserts buildInfo is WindowsBuildInfo {
  assertObjectHasKeys(buildInfo, 'buildInfo', commonKeys);
  assertObjectHasKeys(buildInfo, 'buildInfo', windowsFilenameKeys);
  assert(typeof buildInfo === 'object', 'Expected buildInfo to be an object');
  assert(buildInfo !== null, 'Expected buildInfo to be an object');
  assert(
    'installerOptions' in buildInfo &&
      typeof buildInfo.installerOptions === 'object',
    'Expected buildInfo.installerOptions to be an object'
  );
  const { installerOptions } = buildInfo;
  assert(
    typeof installerOptions === 'object' &&
      installerOptions !== null &&
      'name' in installerOptions &&
      typeof installerOptions.name === 'string',
    'Expected buildInfo.installerOptions.name to be a string'
  );
}

export const osxFilenameKeys = [
  'osx_dmg_filename',
  'osx_zip_filename',
] as const;
export type OSXBuildInfo = CommonBuildInfo &
  Record<typeof osxFilenameKeys[number], string> & {
    installerOptions: {
      title: string;
    };
  };

export function assertBuildInfoIsOSX(
  buildInfo: unknown
): asserts buildInfo is OSXBuildInfo {
  assertObjectHasKeys(buildInfo, 'buildInfo', commonKeys);
  assertObjectHasKeys(buildInfo, 'buildInfo', osxFilenameKeys);
  assert(typeof buildInfo === 'object', 'Expected buildInfo to be an object');
  assert(buildInfo !== null, 'Expected buildInfo to be an object');
  assert(
    'installerOptions' in buildInfo &&
      typeof buildInfo.installerOptions === 'object',
    'Expected buildInfo.installerOptions to be an object'
  );
  const { installerOptions } = buildInfo;
  assert(
    typeof installerOptions === 'object' &&
      installerOptions !== null &&
      'title' in installerOptions &&
      typeof installerOptions.title === 'string',
    'Expected buildInfo.installerOptions.title to be a string'
  );
}

export const ubuntuFilenameKeys = [
  'linux_deb_filename',
  'linux_tar_filename',
] as const;
export type UbuntuBuildInfo = CommonBuildInfo &
  Record<typeof ubuntuFilenameKeys[number], string>;

export function assertBuildInfoIsUbuntu(
  buildInfo: unknown
): asserts buildInfo is UbuntuBuildInfo {
  assertObjectHasKeys(buildInfo, 'buildInfo', commonKeys);
  assertObjectHasKeys(buildInfo, 'buildInfo', ubuntuFilenameKeys);
}

const rhelFilenameKeys = ['linux_rpm_filename', 'rhel_tar_filename'] as const;
export type RHELBuildInfo = CommonBuildInfo &
  Record<typeof rhelFilenameKeys[number], string>;

export function assertBuildInfoIsRHEL(
  buildInfo: unknown
): asserts buildInfo is RHELBuildInfo {
  assertObjectHasKeys(buildInfo, 'buildInfo', commonKeys);
  assertObjectHasKeys(buildInfo, 'buildInfo', rhelFilenameKeys);
}

export type PackageDetails = {
  kind: PackageKind;
  filename: string;
  autoUpdatable: boolean;
} & (
  | {
      kind: 'windows_setup' | 'windows_msi' | 'windows_zip';
      buildInfo: WindowsBuildInfo;
    }
  | {
      kind: 'osx_dmg' | 'osx_zip';
      buildInfo: OSXBuildInfo;
    }
  | {
      kind: 'linux_deb' | 'linux_tar';
      buildInfo: UbuntuBuildInfo;
    }
  | {
      kind: 'linux_rpm' | 'rhel_tar';
      buildInfo: RHELBuildInfo;
    }
);

/**
 * Extracts the filename of the packaged app from the build info, specific to a kind of package.
 */
export function getPackageDetails(
  kind: PackageKind,
  buildInfo: unknown
): PackageDetails {
  if (
    kind === 'windows_setup' ||
    kind === 'windows_msi' ||
    kind === 'windows_zip'
  ) {
    assertBuildInfoIsWindows(buildInfo);
    return {
      kind,
      buildInfo,
      filename: buildInfo[`${kind}_filename`],
      autoUpdatable: kind === 'windows_setup',
    };
  } else if (kind === 'osx_dmg' || kind === 'osx_zip') {
    assertBuildInfoIsOSX(buildInfo);
    return {
      kind,
      buildInfo,
      filename: buildInfo[`${kind}_filename`],
      autoUpdatable: true,
    };
  } else if (kind === 'linux_deb' || kind === 'linux_tar') {
    assertBuildInfoIsUbuntu(buildInfo);
    return {
      kind,
      buildInfo,
      filename: buildInfo[`${kind}_filename`],
      autoUpdatable: false,
    };
  } else if (kind === 'linux_rpm' || kind === 'rhel_tar') {
    assertBuildInfoIsRHEL(buildInfo);
    return {
      kind,
      buildInfo,
      filename: buildInfo[`${kind}_filename`],
      autoUpdatable: false,
    };
  } else {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`Unsupported package kind: ${kind}`);
  }
}

function readJson<T extends object>(...segments: string[]): T {
  const result = JSON.parse(
    fs.readFileSync(path.join(...segments), 'utf8')
  ) as unknown;
  assert(typeof result === 'object' && result !== null, 'Expected an object');
  return result as T;
}

export function readPackageDetails(
  kind: PackageKind,
  filePath: string
): PackageDetails {
  const result = readJson(filePath);
  return getPackageDetails(kind, result);
}

export function writeAndReadPackageDetails({
  package: packageKind,
  platform,
  arch,
  sandboxPath,
}: SmokeTestsContextWithSandbox): PackageDetails {
  const infoArgs = {
    format: 'json',
    dir: COMPASS_PATH,
    platform,
    arch,
    out: path.resolve(sandboxPath, 'target.json'),
  };
  debug({ infoArgs });

  // Removing the DEV_VERSION_IDENTIFIER variable if it's empty
  // - to avoid any potential (future) issues from CI setting it without providing a value
  if (process.env.DEV_VERSION_IDENTIFIER === '') {
    delete process.env.DEV_VERSION_IDENTIFIER;
  }

  // These are known environment variables that will affect the way
  // writeBuildInfo works. Log them as a reminder and for our own sanity
  debug(
    'info env vars',
    pick(process.env, [
      'HADRON_DISTRIBUTION',
      'HADRON_APP_VERSION',
      'HADRON_PRODUCT',
      'HADRON_PRODUCT_NAME',
      'HADRON_READONLY',
      'HADRON_ISOLATED',
      'DEV_VERSION_IDENTIFIER',
      'IS_RHEL',
    ])
  );
  writeBuildInfo(infoArgs);
  return readPackageDetails(packageKind, infoArgs.out);
}
