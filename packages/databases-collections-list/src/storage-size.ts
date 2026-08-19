/**
 * Atlas disaggregated storage ("Infinite") clusters filter `storageSize` out of
 * `dbStats` and `$collStats` for non-internal users, because the value describes
 * space in the shared storage layer rather than anything the customer can act
 * on. Rather than detecting the cluster type — which a client cannot do reliably
 * for every user role — we decide from the data: if nothing reports a storage
 * size, the column has nothing to say and is dropped.
 *
 * Rows are only considered once their stats have been fetched, so the column
 * does not disappear and reappear while a list is still loading.
 */
export function shouldShowStorageSizeColumn(
  items: { status: string; storage_size?: number | undefined }[]
): boolean {
  const withFetchedStats = items.filter((item) => {
    return item.status === 'ready' || item.status === 'refreshing';
  });

  if (withFetchedStats.length === 0) {
    return true;
  }

  return withFetchedStats.some((item) => {
    return item.storage_size !== undefined;
  });
}
