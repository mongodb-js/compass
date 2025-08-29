export function getAtlasUpgradeClusterLink({
  clusterName,
}: {
  clusterName: string;
}) {
  return `#/clusters/edit/${encodeURIComponent(clusterName)}`;
}
