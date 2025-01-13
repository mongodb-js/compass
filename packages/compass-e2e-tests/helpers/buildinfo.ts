import assert from 'node:assert/strict';

// subsets of the hadron-build info result

const commonKeys = ['productName'];
type CommonBuildInfo = Record<typeof commonKeys[number], string>;

function assertObjectHasKeys(obj: unknown, name: string, keys: readonly string[]) {
  assert(
    typeof obj === 'object' && obj !== null,
    'Expected buildInfo to be an object'
  );

  for (const key of keys) {
    assert(key in obj, `Expected '${name}' to have '${key}'`);
  }
}

export function assertCommonBuildInfo(
  buildInfo: unknown
): asserts buildInfo is CommonBuildInfo {
  assertObjectHasKeys(buildInfo, 'buildInfo', commonKeys);
}

const windowsFilenameKeys = [
  'windows_setup_filename',
  'windows_msi_filename',
  'windows_zip_filename',
  'windows_nupkg_full_filename',
] as const;
type WindowsBuildInfo = CommonBuildInfo &
  Record<typeof windowsFilenameKeys[number], string>;

const osxFilenameKeys = ['osx_dmg_filename', 'osx_zip_filename'] as const;
type OSXBuildInfo = CommonBuildInfo &
  Record<typeof osxFilenameKeys[number], string>;

const ubuntuFilenameKeys = [
  'linux_deb_filename',
  'linux_tar_filename',
] as const;
type UbuntuBuildInfo = CommonBuildInfo &
  Record<typeof ubuntuFilenameKeys[number], string>;

const rhelFilenameKeys = ['linux_rpm_filename', 'rhel_tar_filename'] as const;
type RHELBuildInfo = CommonBuildInfo &
  Record<typeof rhelFilenameKeys[number], string>;

export function assertBuildInfoIsWindows(
  buildInfo: unknown
): asserts buildInfo is WindowsBuildInfo {
  assertObjectHasKeys(buildInfo, 'buildInfo', commonKeys);
  assertObjectHasKeys(buildInfo, 'buildInfo', windowsFilenameKeys);
}

export function assertBuildInfoIsOSX(
  buildInfo: unknown
): asserts buildInfo is OSXBuildInfo {
  assertObjectHasKeys(buildInfo, 'buildInfo', commonKeys);
  assertObjectHasKeys(buildInfo, 'buildInfo', osxFilenameKeys);
}

export function assertBuildInfoIsUbuntu(
  buildInfo: unknown
): buildInfo is UbuntuBuildInfo {
  assertObjectHasKeys(buildInfo, 'buildInfo', commonKeys);
  assertObjectHasKeys(buildInfo, 'buildInfo', ubuntuFilenameKeys);
  return true;
}

export function assertBuildInfoIsRHEL(
  buildInfo: any
): asserts buildInfo is RHELBuildInfo {
  assertObjectHasKeys(buildInfo, 'buildInfo', commonKeys);
  assertObjectHasKeys(buildInfo, 'buildInfo', rhelFilenameKeys);
}
