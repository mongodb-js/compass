import { usePreference } from 'compass-preferences-model/provider';

/**
 * Hook to check if the My Queries Data Explorer feature is enabled.
 * This controls access to:
 * - Saved queries and aggregations
 * - Recent queries autocomplete
 * - Favorite queries/aggregations
 */
export function useMyQueriesFeature(): boolean {
  // This preference will be passed from MMS router as initialPreference
  // based on settingsModel.hasProjectFeature('DATA_EXPLORER_SAVES_USER_DATA')
  const enableMyQueries = usePreference('enableMyQueries');

  // Debug logging to verify the preference is being passed correctly
  console.log('useMyQueriesFeature - enableMyQueries:', enableMyQueries);

  return enableMyQueries ?? false;
}
