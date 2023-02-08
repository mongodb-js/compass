import semver from 'semver';
import type { IndexField } from '../modules/create-index/fields';

const MIN_COLUMNSTORE_INDEXES_SERVER_VERSION = '6.3.0-alpha0';

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
