import type { ParsedGlobalPreferencesResult} from 'compass-preferences-model';
import preferences, { setupPreferences } from 'compass-preferences-model';
// @ts-expect-error no TS definitions available
import User from 'compass-user-model';

export async function setupPreferencesAndUserModel(globalPreferences: ParsedGlobalPreferencesResult): Promise<void> {
  await setupPreferences(globalPreferences);

  const {
    currentUserId,
    telemetryAnonymousId
  } = preferences.getPreferences();

  // Check if uuid was stored as currentUserId, if not pass telemetryAnonymousId to fetch a user.
  const user = await User.getOrCreate(currentUserId || telemetryAnonymousId);
  const changedPreferences = { telemetryAnonymousId: user.id };
  await preferences.savePreferences(changedPreferences);
}
