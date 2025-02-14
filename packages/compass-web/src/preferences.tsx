import React, { useContext, useRef, useEffect } from 'react';
import type { AllPreferences } from 'compass-preferences-model/provider';
import { CompassWebPreferencesAccess } from 'compass-preferences-model/provider';

export type SandboxPreferencesUpdateTrigger = (
  updatePreference: (preferences: Partial<AllPreferences>) => Promise<void>
) => () => void;

const SandboxPreferencesUpdateTriggerContext =
  React.createContext<SandboxPreferencesUpdateTrigger | null>(null);

function useSandboxPreferencesUpdateTrigger() {
  const updateTrigger = useContext(SandboxPreferencesUpdateTriggerContext);
  return updateTrigger;
}

/**
 * Only used in the sandbox to provide a way to update preferences.
 * @internal
 */
export const SandboxPreferencesUpdateProvider = ({
  value,
  children,
}: {
  value: SandboxPreferencesUpdateTrigger | null;
  children: React.ReactNode;
}) => {
  return (
    <SandboxPreferencesUpdateTriggerContext.Provider value={value}>
      {children}
    </SandboxPreferencesUpdateTriggerContext.Provider>
  );
};

export function useCompassWebPreferences(
  initialPreferences?: Partial<AllPreferences>
): React.MutableRefObject<CompassWebPreferencesAccess> {
  const preferencesAccess = useRef(
    new CompassWebPreferencesAccess({
      enableExplainPlan: true,
      enableAggregationBuilderRunPipeline: true,
      enableAggregationBuilderExtraOptions: true,
      enableAtlasSearchIndexes: false,
      enableImportExport: false,
      enableGenAIFeatures: true,
      enableGenAIFeaturesAtlasProject: false,
      enableGenAISampleDocumentPassingOnAtlasProject: false,
      enableGenAIFeaturesAtlasOrg: false,
      enablePerformanceAdvisorBanner: true,
      cloudFeatureRolloutAccess: {
        GEN_AI_COMPASS: false,
      },
      maximumNumberOfActiveConnections: 10,
      trackUsageStatistics: true,
      enableShell: false,
      enableCreatingNewConnections: false,
      enableGlobalWrites: false,
      optInDataExplorerGenAIFeatures: false,
      enableConnectInNewWindow: false,
      ...initialPreferences,
    })
  );

  const onPreferencesUpdateTriggered = useSandboxPreferencesUpdateTrigger();

  useEffect(() => {
    // This is used by our e2e tests so that we can call a global function in the browser
    // from the testing runtime to update preferences.
    return onPreferencesUpdateTriggered?.(async (preferences) => {
      await preferencesAccess.current.savePreferences(preferences);
    });
  }, [onPreferencesUpdateTriggered]);

  return preferencesAccess;
}
