import semver from 'semver';

export function isAtlasVectorSearchSupportedForServerVersion(
  serverVersion: string | undefined | null
) {
  // Atlas vector search is only supported v6.0.11+, v7.0.2+
  // https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-overview/
  if (!serverVersion) {
    return true;
  }
  try {
    return (
      semver.gte(serverVersion, '7.0.2') ||
      (semver.gte(serverVersion, '6.0.11') && semver.lt(serverVersion, '7.0.0'))
    );
  } catch {
    return true;
  }
}
