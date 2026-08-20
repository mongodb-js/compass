import type { CollectionProps } from 'mongodb-collection-model';
import type { DatabaseProps } from 'mongodb-database-model';

/**
 * Decides whether to show the storage size column in the databases and collections lists.
 * If none of the items have a storage size, the column is hidden.
 */
export function shouldShowStorageSizeColumn(
  items: (DatabaseProps | CollectionProps)[]
): boolean {
  const withFetchedStats = items.filter(
    (item) =>
      ['ready', 'refreshing'].includes(item.status) &&
      // Views never report a storage size, so they must not influence the decision:
      // a database holding only views would otherwise lose the column.
      ('type' in item ? item.type !== 'view' : true)
  );

  if (withFetchedStats.length === 0) {
    return true;
  }

  return withFetchedStats.some((item) => item.storage_size !== undefined);
}
