import { downloadFile } from './downloads';
import { type PackageKind } from './packages';

type Arch = 'arm64' | 'x64';

type PlatformShortName =
  | 'darwin-arm64'
  | 'darwin-x64'
  | 'windows'
  | 'linux_deb'
  | 'linux_rpm';

function getPlatformShortName(
  arch: Arch,
  kind: PackageKind
): PlatformShortName {
  if (arch === 'arm64') {
    if (kind === 'osx_dmg' || kind === 'osx_zip') {
      return 'darwin-arm64';
    }
  }
  if (arch === 'x64') {
    if (kind === 'osx_dmg' || kind === 'osx_zip') {
      return 'darwin-x64';
    }
    if (
      kind === 'windows_setup' ||
      kind === 'windows_msi' ||
      kind === 'windows_zip'
    ) {
      return 'windows';
    }
    if (kind === 'linux_deb' || kind === 'linux_tar') {
      return 'linux_deb';
    }
    if (kind === 'linux_rpm' || kind === 'rhel_tar') {
      return 'linux_rpm';
    }
  }

  throw new Error(`Unsupported arch/kind combo: ${arch}/${kind}`);
}

type PlatformExtension = 'dmg' | 'exe' | 'deb' | 'rpm';

function getPlatformExtension(
  arch: Arch,
  kind: PackageKind
): PlatformExtension {
  if (arch === 'arm64') {
    if (kind === 'osx_dmg' || kind === 'osx_zip') {
      return 'dmg';
    }
  }
  if (arch === 'x64') {
    if (kind === 'osx_dmg' || kind === 'osx_zip') {
      return 'dmg';
    }
    if (
      kind === 'windows_setup' ||
      kind === 'windows_msi' ||
      kind === 'windows_zip'
    ) {
      return 'exe';
    }
    if (kind === 'linux_deb' || kind === 'linux_tar') {
      return 'deb';
    }
    if (kind === 'linux_rpm' || kind === 'rhel_tar') {
      return 'rpm';
    }
  }

  throw new Error(`Unsupported arch/kind combo: ${arch}/${kind}`);
}

export async function getLatestRelease(
  channel: 'dev' | 'beta' | 'stable',
  arch: Arch,
  kind: PackageKind,
  forceDownload?: boolean
): Promise<string> {
  const shortName = getPlatformShortName(arch, kind);
  const extension = getPlatformExtension(arch, kind);

  return await downloadFile({
    url: `http://compass.mongodb.com/api/v2/download/latest/compass/${channel}/${shortName}`,
    targetFilename: `latest-${channel}.${extension}`,
    clearCache: forceDownload,
  });
}

export function getLatestReleaseKindByKind(kind: PackageKind): PackageKind {
  if (kind === 'osx_dmg' || kind === 'osx_zip') {
    return 'osx_dmg';
  }

  if (
    kind === 'windows_setup' ||
    kind === 'windows_msi' ||
    kind === 'windows_zip'
  ) {
    return 'windows_setup';
  }

  if (kind === 'linux_deb' || kind === 'linux_tar') {
    return 'linux_deb';
  }

  if (kind === 'linux_rpm' || kind === 'rhel_tar') {
    return 'linux_rpm';
  }

  throw new Error(`Unsupported kind: ${kind as string}`);
}
