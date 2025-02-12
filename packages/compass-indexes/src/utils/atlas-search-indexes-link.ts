import toNS from 'mongodb-ns';

/**
 * List to Atlas search indexes page. Supports certain query params that can be
 * part of hash url: https://github.com/10gen/mms/blob/ba8025a4be58591cea0299ab500d2cf06e187f95/client/packages/project/nds/clusters/components/AtlasSearch/routeUtil.ts#L20-L30
 */
export function getAtlasSearchIndexesLink({
  clusterName,
  namespace,
}: {
  clusterName: string;
  namespace: string;
}) {
  const { database, collection } = toNS(namespace);
  // Atlas Search URL params are parsed from hash, they are not real search
  // params on a URL, appended at the end of hash part
  let url = `#/clusters/atlasSearch/${encodeURIComponent(clusterName)}`;
  if (database && collection) {
    url +=
      `?database=${encodeURIComponent(database)}` +
      `&collectionName=${encodeURIComponent(collection)}`;
  }
  return url;
}
