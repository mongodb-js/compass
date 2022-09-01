import semver from 'semver';

const MIN_CLUSTERED_COLLECTION_SERVER_VERSION = '5.3.0-alpha0';

export default function hasClusteredCollectionSupport(serverVersion) {
  try {
    return semver.gte(serverVersion, MIN_CLUSTERED_COLLECTION_SERVER_VERSION);
  } catch (e) {
    return true;
  }
}
