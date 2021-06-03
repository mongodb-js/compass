import semver from 'semver';

const MIN_TIME_SERIES_SERVER_VERSION = '5.0.0-alpha0';

export default function hasTimeSeriesSupport(serverVersion) {
  try {
    return semver.gte(serverVersion, MIN_TIME_SERIES_SERVER_VERSION);
  } catch (e) {
    return true;
  }
}
