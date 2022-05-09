import semver from 'semver';

const MIN_COLUMNSTORE_INDEXES_SERVER_VERSION = '6.1.0-alpha0';

export function hasColumnstoreIndexesSupport(serverVersion: string): boolean {
  const columnstoreIndexesFeatureFlag =
    process?.env?.COMPASS_COLUMNSTORE_INDEXES === 'true';

  if (!columnstoreIndexesFeatureFlag) {
    return false;
  }

  try {
    return semver.gte(serverVersion, MIN_COLUMNSTORE_INDEXES_SERVER_VERSION);
  } catch (e) {
    return true;
  }
}
