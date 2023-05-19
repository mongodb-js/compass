import semver from 'semver';
import type { IndexField } from '../modules/create-index/fields';

// The expected version is at least 9.0 (and a lot could change before then),
// so we bump the min version for columnstore indexes again to a much bigger number,
// to keep the existing functionality but effectively hide it.
// https://jira.mongodb.org/browse/COMPASS-6783
export const MIN_COLUMNSTORE_INDEXES_SERVER_VERSION = '20.0.0-alpha0';

export function hasColumnstoreIndex(fields: IndexField[]) {
  return fields.some((field: IndexField) => field.type === 'columnstore');
}

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
