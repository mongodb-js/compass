export function capMaxTimeMSAtPreferenceLimit<T>(
  preferences: { getPreferences(): { maxTimeMS?: number } },
  value: T
): T | number {
  const preferenceMaxTimeMS = preferences.getPreferences().maxTimeMS;
  if (typeof value === 'number' && typeof preferenceMaxTimeMS === 'number') {
    return Math.min(value, preferenceMaxTimeMS);
  } else if (typeof preferenceMaxTimeMS === 'number') {
    return preferenceMaxTimeMS;
  }
  return value;
}
