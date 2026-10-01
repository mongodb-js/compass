import type { CollectionMetadata } from 'mongodb-collection-model';
import {
  isAIFeatureEnabled,
  type AllPreferences,
} from 'compass-preferences-model/provider';

export function isMockDataGeneratorEligible(
  metadata: CollectionMetadata | null,
  preferences: Pick<
    AllPreferences,
    | 'enableGenAIFeatures'
    | 'enableGenAIFeaturesAtlasOrg'
    | 'readOnly'
    | 'enableMockDataGenerator'
  >
): boolean {
  return Boolean(
    metadata &&
      !metadata.isReadonly &&
      !metadata.isTimeSeries &&
      !metadata.sourceName &&
      !preferences.readOnly &&
      isAIFeatureEnabled(preferences) &&
      preferences.enableMockDataGenerator
  );
}
