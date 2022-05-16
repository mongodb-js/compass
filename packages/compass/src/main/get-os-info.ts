import os from 'os';
import { promises as fs } from 'fs';

type OsInfo = {
  os_type: string;
  os_version: string;
  os_arch: string;
  os_release: string;
  os_linux_dist?: string;
  os_linux_release?: string;
};

async function getLinuxInfo(): Promise<{
  os_linux_dist: string;
  os_linux_release: string;
}> {
  try {
    const releaseFile = '/etc/os-release';
    const etcRelease = await fs.readFile(releaseFile, 'utf-8');

    const releaseKv = etcRelease
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => l.split('='));

    const distId = releaseKv
      .find(([k]) => k === 'ID')?.[1]
      .replace(/["']/g, '');
    const distVer = releaseKv
      .find(([k]) => k === 'VERSION_ID')?.[1]
      .replace(/["']/g, '');

    return {
      os_linux_dist: distId || 'unknown',
      os_linux_release: distVer || 'unknown',
    };
  } catch (e) {
    // couldn't read /etc/os-release
  }

  return {
    os_linux_dist: 'unknown',
    os_linux_release: 'unknown',
  };
}

export async function getOsInfo(): Promise<OsInfo> {
  return {
    os_type: os.type(),
    os_version: os.version(),
    os_arch: os.arch(),
    os_release: os.release(),
    ...(process.platform === 'linux' ? await getLinuxInfo() : {}),
  };
}
