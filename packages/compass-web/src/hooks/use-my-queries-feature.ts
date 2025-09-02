import { usePreference } from 'compass-preferences-model/provider';

/**
 * Hook to check if the My Queries Data Explorer feature is enabled.
 * This controls access to:
 * - Saved queries and aggregations
 * - Recent queries autocomplete
 * - Favorite queries/aggregations
 */
export function useMyQueriesFeature(): boolean {
  const cloudFeatureRolloutAccess = usePreference('cloudFeatureRolloutAccess');
  return cloudFeatureRolloutAccess?.MY_QUERIES_DATA_EXPLORER ?? false;
}
