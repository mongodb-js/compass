import { type PackageKind } from '../packages';
import { installMacDMG } from './mac-dmg';
import { installMacZIP } from './mac-zip';
import { installWindowsZIP } from './windows-zip';
import { installWindowsMSI } from './windows-msi';
import { installWindowsSetup } from './windows-setup';
import { installLinuxTar } from './linux-tar';
import { installLinuxDeb } from './linux-deb';
import { installLinuxRpm } from './linux-rpm';

export function getInstaller(kind: PackageKind) {
  if (kind === 'osx_dmg') {
    return installMacDMG;
  } else if (kind === 'osx_zip') {
    return installMacZIP;
  } else if (kind === 'windows_zip') {
    return installWindowsZIP;
  } else if (kind === 'windows_msi') {
    return installWindowsMSI;
  } else if (kind === 'windows_setup') {
    return installWindowsSetup;
  } else if (kind === 'linux_tar') {
    return installLinuxTar;
  } else if (kind === 'linux_deb') {
    return installLinuxDeb;
  } else if (kind === 'linux_rpm') {
    return installLinuxRpm;
  } else {
    throw new Error(`Installer for '${kind}' is not yet implemented`);
  }
}
