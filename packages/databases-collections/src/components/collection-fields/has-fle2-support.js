import semver from 'semver';

const MIN_FLE2_SERVER_VERSION = '6.0.0-alpha0';

export default function hasFLE2Support(
  serverVersion,
  currentTopologyType,
  configuredKMSProviders
) {
  if (currentTopologyType === 'Single') {
    return false;
  }

  // Theoretically, we could still allow users to create FLE2 collections
  // even with CSFLE support disabled. This would mean that they would always
  // have to manually copy keys from somewhere, which is not a great UX
  // and something that is probably done more easily in the shell anyway.
  if (!configuredKMSProviders || configuredKMSProviders.length === 0) {
    return false;
  }

  try {
    return semver.gte(serverVersion, MIN_FLE2_SERVER_VERSION);
  } catch (e) {
    return true;
  }
}
