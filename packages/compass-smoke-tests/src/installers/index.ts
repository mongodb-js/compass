import { type PackageKind } from '../packages';
import { installMacDMG } from './mac-dmg';
import { installMacZIP } from './mac-zip';
import { installWindowsZIP } from './windows-zip';
import { installWindowsMSI } from './windows-msi';

export function getInstaller(kind: PackageKind) {
  if (kind === 'osx_dmg') {
    return installMacDMG;
  } else if (kind === 'osx_zip') {
    return installMacZIP;
  } else if (kind === 'windows_zip') {
    return installWindowsZIP;
  } else if (kind === 'windows_msi') {
    return installWindowsMSI;
  } else {
    throw new Error(`Installer for '${kind}' is not yet implemented`);
  }
}
