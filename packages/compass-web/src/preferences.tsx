import { CompassWebPreferencesAccess } from 'compass-preferences-model/provider';
import { useEffect, useState } from 'react';
import { isCancelError } from '@mongodb-js/compass-utils';

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

// TODO: Replace with actual implementation
async function getPreferencesFromCloudApi(_abortSignal?: AbortSignal) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const {
    enableMultiplexWebSocketOnWeb,
    enableAIAssistant,
    ...restOfThePreferences
  } = {
    showDisabledConnections: true,
    enableGenAIFeaturesAtlasProject: true,
    enableGenAISampleDocumentPassing: false,
    enableGenAIFeaturesAtlasOrg: true,
    enableGlobalWrites: false,
    optInGenAIFeatures: false,
    telemetryAtlasUserId: 'some-user-id-from-cloud-api',
    enableRollingIndexes: false,
    enableAIAssistant: false,
    enableGenAIToolCallingAtlasProject: false,
    atlasServiceBackendPreset: 'atlas-dev' as const,
    enableMyQueries: true,
    enableMultiplexWebSocketOnWeb: false,
  };

  return {
    initialPreferences: restOfThePreferences,
    atlasCloudFeatureFlags: {
      enableAIAssistant,
      enableMultiplexWebSocketOnWeb,
    },
  };
}

/**
 * @internal
 * exported for the sandbox to be able to hook into these
 */
export let compassWebPreferences: CompassWebPreferencesAccess | null = null;

export function useCompassWebPreferences(): {
  preferencesAccess: CompassWebPreferencesAccess | null;
  isLoading: boolean;
  error: Error | null;
} {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [initialPreferences, setInitialPreferences] =
    useState<CompassWebPreferencesAccess | null>(compassWebPreferences);

  useEffect(() => {
    if (compassWebPreferences) {
      return;
    }

    async function setupPreferences(abortSignal?: AbortSignal) {
      try {
        setIsLoading(true);
        const { initialPreferences, atlasCloudFeatureFlags } =
          await getPreferencesFromCloudApi(abortSignal);
        const prefs = new CompassWebPreferencesAccess(
          {
            ...DEFAULT_COMPASS_WEB_PREFERENCES,
            ...initialPreferences,
          },
          { atlasCloud: atlasCloudFeatureFlags }
        );
        compassWebPreferences = prefs;
        setInitialPreferences(prefs);
        setIsLoading(false);
      } catch (err) {
        if (isCancelError(err)) {
          return;
        }
        setError(err as Error);
      }
    }
    const controller = new AbortController();
    void setupPreferences(controller.signal);
    return () => {
      controller.abort();
    };
  }, []);

  return {
    preferencesAccess: initialPreferences,
    isLoading,
    error,
  };
}

export function setCompassWebPreferencesAccess(
  preferencesAccess: CompassWebPreferencesAccess
) {
  compassWebPreferences = preferencesAccess;
}
