import semver from 'semver';

const MIN_FLE2_SERVER_VERSION = '6.0.0-alpha0';

export default function hasFLE2Support(serverVersion, currentTopologyType) {
  const fle2FeatureFlag = process?.env?.COMPASS_CSFLE_SUPPORT === 'true';

  if (!fle2FeatureFlag) {
    return false;
  }

  if (currentTopologyType === 'Single') {
    return false;
  }

  try {
    return semver.gte(serverVersion, MIN_FLE2_SERVER_VERSION);
  } catch (e) {
    return true;
  }
}
