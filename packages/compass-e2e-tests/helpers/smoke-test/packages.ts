export const SUPPORTED_PACKAGES = [
  'windows_setup',
  'windows_msi',
  'windows_zip',
  'osx_dmg',
  'osx_zip',
  'linux_deb',
  'linux_tar',
  'linux_rpm',
  'rhel_tar',
] as const;

export type PackageKind = typeof SUPPORTED_PACKAGES[number];
