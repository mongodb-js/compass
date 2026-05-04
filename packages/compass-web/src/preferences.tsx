import { useEffect, useRef } from 'react';
import { isEqual } from 'lodash';
import type {
  AllPreferences,
  AtlasCloudFeatureFlags,
} from 'compass-preferences-model/provider';
import { CompassWebPreferencesAccess } from 'compass-preferences-model/provider';
import { useInitialValue } from '@mongodb-js/compass-components';

const DEFAULT_COMPASS_WEB_PREFERENCES = {
  enableExplainPlan: true,
  enableAggregationBuilderRunPipeline: true,
  enableAggregationBuilderExtraOptions: true,
  enableAtlasSearchIndexes: false,
  enableImportExport: false,
  enableGenAIFeatures: true,
  enableGenAIFeaturesAtlasProject: false,
  enableGenAISampleDocumentPassing: false,
  enableGenAIFeaturesAtlasOrg: false,
  enableGenAIToolCallingAtlasProject: true,
  enablePerformanceAdvisorBanner: true,
  enableMyQueries: false,
  cloudFeatureRolloutAccess: {
    GEN_AI_COMPASS: false,
  },
  maximumNumberOfActiveConnections: 10,
  trackUsageStatistics: true,
  enableShell: false,
  enableCreatingNewConnections: false,
  enableGlobalWrites: false,
  optInGenAIFeatures: false,
  enableConnectInNewWindow: false,
  maxTimeMSEnvLimit: 300_000, // 5 minutes limit for Data Explorer}
};

/**
 * @internal
 * exported for the sandbox to be able to hook into these
 */
export let compassWebPreferences: CompassWebPreferencesAccess | null = null;

export function useCompassWebPreferences(
  initialPreferences: Partial<AllPreferences> = {},
  atlasCloudFeatureFlags: Partial<AtlasCloudFeatureFlags> = {}
): CompassWebPreferencesAccess {
  // We do want to keep a reference to current value of preferencesAccess in
  // compass-web so that in can be exposed in the sandbox. In real production
  // build this value just never leaves the module scope, so there's no way to
  // access it
  // eslint-disable-next-line react-hooks/globals
  const preferencesAccess = (compassWebPreferences = useInitialValue(() => {
    return new CompassWebPreferencesAccess(
      {
        ...DEFAULT_COMPASS_WEB_PREFERENCES,
        ...initialPreferences,
      },
      { atlasCloud: atlasCloudFeatureFlags }
    );
  }));

  const prevPrefsRef = useRef(initialPreferences);
  const prevFlagsRef = useRef(atlasCloudFeatureFlags);

  useEffect(() => {
    const prefsChanged = !isEqual(prevPrefsRef.current, initialPreferences);
    const flagsChanged = !isEqual(prevFlagsRef.current, atlasCloudFeatureFlags);

    if (!prefsChanged && !flagsChanged) {
      return;
    }

    prevPrefsRef.current = initialPreferences;
    prevFlagsRef.current = atlasCloudFeatureFlags;

    void preferencesAccess.syncEmbedderProvidedPreferences(
      initialPreferences,
      atlasCloudFeatureFlags
    );
  }, [preferencesAccess, initialPreferences, atlasCloudFeatureFlags]);

  return preferencesAccess;
}
