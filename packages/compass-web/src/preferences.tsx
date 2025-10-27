import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type {
  AllPreferences,
  AtlasCloudFeatureFlags,
  PreferencesAccess,
} from 'compass-preferences-model/provider';
import { CompassWebPreferencesAccess } from 'compass-preferences-model/provider';

type SandboxSetPreferencesGlobalAccess = (
  preferences: PreferencesAccess
) => () => void;

const SandboxPreferencesGlobalAccessContext =
  React.createContext<SandboxSetPreferencesGlobalAccess | null>(null);

const kSandboxPreferencesAccess = Symbol.for(
  '@compass-web-sandbox-preferences-access'
);

/**
 * Only used in the sandbox to provide a way to update preferences.
 * @internal
 */
export const SandboxPreferencesGlobalAccessProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const setPreferencesAccess = useCallback((preferences: PreferencesAccess) => {
    (globalThis as any)[kSandboxPreferencesAccess] = preferences;
    // eslint-disable-next-line no-console
    console.info(
      `[compass-web sandbox] call window[Symbol.for('@compass-web-sandbox-preferences-access')].savePreferences({}) to dynamically update preferences`
    );
    return () => {
      delete (globalThis as any)[kSandboxPreferencesAccess];
    };
  }, []);

  return (
    <SandboxPreferencesGlobalAccessContext.Provider
      value={setPreferencesAccess}
    >
      {children}
    </SandboxPreferencesGlobalAccessContext.Provider>
  );
};

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

export function useCompassWebPreferences(
  initialPreferences: Partial<AllPreferences> = {},
  atlasCloudFeatureFlags: Partial<AtlasCloudFeatureFlags> = {}
): React.MutableRefObject<CompassWebPreferencesAccess> {
  const preferencesAccess = useRef(
    new CompassWebPreferencesAccess(
      {
        ...DEFAULT_COMPASS_WEB_PREFERENCES,
        ...initialPreferences,
      },
      { atlasCloud: atlasCloudFeatureFlags }
    )
  );

  const setPreferencesAccess = useContext(
    SandboxPreferencesGlobalAccessContext
  );

  useEffect(() => {
    // This is used by our sandbox so that we can call a global function in the
    // browser from the sandbox / testing runtime to access preferences.
    return setPreferencesAccess?.(preferencesAccess.current);
  }, [setPreferencesAccess]);

  return preferencesAccess;
}
