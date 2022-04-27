import semver from 'semver';

const MIN_COLUMNSTORE_INDEXES_SERVER_VERSION = '6.1.0-alpha0';

export function hasColumnstoreIndexesSupport(serverVersion: string): boolean {
  try {
    return semver.gte(serverVersion, MIN_COLUMNSTORE_INDEXES_SERVER_VERSION);
  } catch (e) {
    return true;
  }
}
