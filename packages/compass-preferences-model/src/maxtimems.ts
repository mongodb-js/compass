export function capMaxTimeMSAtPreferenceLimit<T>(
  preferences: { getPreferences(): { maxTimeMS?: number } },
  value: T
): T | number {
  const preferenceMaxTimeMS = preferences.getPreferences().maxTimeMS;
  if (typeof value === 'number' && typeof preferenceMaxTimeMS === 'number') {
    // 0 means "no timeout" in MongoDB, so treat it as unbounded and prefer
    // whichever side actually has a limit set.
    if (value === 0) return preferenceMaxTimeMS;
    if (preferenceMaxTimeMS === 0) return value;
    return Math.min(value, preferenceMaxTimeMS);
  } else if (typeof preferenceMaxTimeMS === 'number') {
    return preferenceMaxTimeMS;
  }
  return value;
}
