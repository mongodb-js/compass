import _ from 'lodash';
import type { SemVer } from 'semver';
import semver from 'semver';

type VersionInfo = {
  semver: SemVer;
  channel: string;
  channelSuffix: string;
};

export function getVersionInfo(version: string): VersionInfo {
  const versionSemver = semver.parse(version);
  if (!versionSemver) {
    throw new Error(`${version} is not a valid semver`);
  }

  const channel = versionSemver.prerelease[0]?.toString() || 'stable';
  const channelSuffix = channel !== 'stable' ? _.upperFirst(channel) : '';
  return {
    semver: versionSemver,
    channel,
    channelSuffix,
  };
}
