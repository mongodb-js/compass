import semver from 'semver';

export const MIN_EDITABLE_TIME_SERIES_SERVER_VERSION = '7.0.0-alpha';

export function hasEditableTimeSeriesSupport(
  serverVersion: string | undefined | null
): boolean {
  if (!serverVersion) {
    return true;
  }
  try {
    return semver.gte(serverVersion, MIN_EDITABLE_TIME_SERIES_SERVER_VERSION);
  } catch (e) {
    return true;
  }
}
