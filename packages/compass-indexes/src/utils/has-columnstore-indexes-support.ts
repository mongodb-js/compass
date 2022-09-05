import semver from 'semver';

const MIN_COLUMNSTORE_INDEXES_SERVER_VERSION = '7.0.0-alpha0';

export function hasColumnstoreIndexesSupport(
  serverVersion: string | undefined | null
): boolean {
  if (!serverVersion) {
    return true;
  }
  try {
    return semver.gte(serverVersion, MIN_COLUMNSTORE_INDEXES_SERVER_VERSION);
  } catch (e) {
    return true;
  }
}
