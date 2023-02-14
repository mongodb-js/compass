import semver from 'semver';

const MIN_SERVER_VERSION_FOR_BUCKET_OPTIONS = '6.3.0-alpha0';

export default function hasFlexibleBucketConfigSupport(serverVersion: string) {
  try {
    return semver.gte(serverVersion, MIN_SERVER_VERSION_FOR_BUCKET_OPTIONS);
  } catch (e) {
    return true;
  }
}
