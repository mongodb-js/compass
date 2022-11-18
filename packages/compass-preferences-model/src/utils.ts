import { preferencesAccess } from './';

export function capMaxTimeMSAtPreferenceLimit<T>(value: T): T | number {
  const preferenceMaxTimeMS = preferencesAccess.getPreferences().maxTimeMS;
  if (typeof value === 'number' && typeof preferenceMaxTimeMS === 'number') {
    return Math.min(value, preferenceMaxTimeMS);
  } else if (typeof preferenceMaxTimeMS === 'number') {
    return preferenceMaxTimeMS;
  }
  return value;
}
