import React, { useContext, useEffect, useRef, useState } from 'react';
import type { AllPreferences } from 'compass-preferences-model/provider';
import { CompassWebPreferencesAccess } from 'compass-preferences-model/provider';

export type SandboxPreferencesUpdateTrigger = (
  updatePreference: (
    preferences: Partial<AllPreferences>
  ) => Promise<AllPreferences>
) => () => void;

const SandboxPreferencesUpdateTriggerContext =
  React.createContext<SandboxPreferencesUpdateTrigger | null>(null);

const kSandboxUpdateFn = Symbol.for('@compass-web-sandbox-update-preferences');

/**
 * Only used in the sandbox to provide a way to update preferences.
 * @internal
 */
export const SandboxPreferencesUpdateProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [updateTrigger] = useState<SandboxPreferencesUpdateTrigger>(() => {
    return (
      updatePreferencesFn: (
        preferences: Partial<AllPreferences>
      ) => Promise<AllPreferences>
    ) => {
      // eslint-disable-next-line no-console
      console.info(
        `[compass-web sandbox] call window[Symbol.for('@compass-web-sandbox-update-preferences')]({}) to dynamically update preferences`
      );
      (globalThis as any)[kSandboxUpdateFn] = (
        preferences: Partial<AllPreferences>
      ) => {
        return updatePreferencesFn(preferences);
      };
      return () => {
        delete (globalThis as any)[kSandboxUpdateFn];
      };
    };
  });

  return (
    <SandboxPreferencesUpdateTriggerContext.Provider value={updateTrigger}>
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
      ...initialPreferences,
    })
  );

  const onPreferencesUpdateTriggered = useContext(
    SandboxPreferencesUpdateTriggerContext
  );

  useEffect(() => {
    // This is used by our sandbox so that we can call a global function in the
    // browser from the sandbox / testing runtime to update preferences.
    return onPreferencesUpdateTriggered?.(async (preferences) => {
      return await preferencesAccess.current.savePreferences(preferences);
    });
  }, [onPreferencesUpdateTriggered]);

  return preferencesAccess;
}
