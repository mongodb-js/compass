import {
  AtlasPreferencesStorage,
  CompassWebPreferencesAccess,
  featureFlags as FEATURE_FLAG_DEFINITIONS,
  isPreferenceNameValid,
  type AllPreferences,
  type FeatureFlagDefinition,
  type FeatureFlags,
} from 'compass-preferences-model/provider';
import { useEffect, useState } from 'react';
import type { AtlasServiceLike } from '@mongodb-js/compass-user-data';

// Minimal AtlasService surface used by the preferences bootstrap. A real
// AtlasService satisfies this structurally.
type PreferencesAtlasService = AtlasServiceLike & {
  cloudEndpoint(path?: string): string;
};

export const DEFAULT_COMPASS_WEB_PREFERENCES = {
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
  enableAssistantConnectionDebugging: false,
  enableAtlasConnectionErrorDebuggerTool: false,
  enableAtlasSignIn: false,
  enablePerformanceAdvisorBanner: true,
  enableMyQueries: false,
  maximumNumberOfActiveConnections: 10,
  trackUsageStatistics: true,
  enableShell: false,
  enableCreatingNewConnections: false,
  enableGlobalWrites: false,
  optInGenAIFeatures: false,
  enableConnectInNewWindow: false,
  maxTimeMSEnvLimit: 300_000, // 5 minutes limit for Data Explorer}
};

// Module-level handles for the preferences access. They are not part of the
// loading path (which lives in useCompassWebPreferences): injected is set
// externally (sandbox override, tests) and consulted instead of loading;
// lastLoaded is written by the hook so the sandbox can expose the current
// access to e2e in Atlas Cloud mode without affecting subsequent loads.
let injectedPreferencesAccess: CompassWebPreferencesAccess | null = null;
let lastLoadedPreferencesAccess: CompassWebPreferencesAccess | null = null;

// These are resolved from the mms API getDataExplorerPreferences endpoint.
// See DataExplorerPreferencesView for parity.
type CloudPreferencesApiResponse = {
  featureFlags: Record<string, boolean>;
  userAuid: string;
  appUser: {
    isOptedIntoDataExplorerGenAIFeatures: boolean;
    timeZoneId: string;
  };
  userRoles: {
    isDataAccessAdmin?: boolean;
    isDataAccessWrite?: boolean;
    isDataAccessAny?: boolean;
    isGroupIndexManager?: boolean;
  };
  currentOrganization: {
    genAIFeaturesEnabled: boolean | null;
  };
};

export function getProjectIdFromUrl(
  pathname = window.location.pathname
): string | undefined {
  return pathname.match(/\/v2\/([a-f0-9]{24})/i)?.[1];
}

export function getAtlasServiceBackendPreset(
  host = window.location.host
): AllPreferences['atlasServiceBackendPreset'] {
  if (host.includes('cloud-dev')) return 'atlas-dev';
  if (host.includes('cloud-qa')) return 'atlas-qa';
  if (host.includes('cloud-stage')) return 'atlas-staging';
  if (host.includes('cloud-local') || host.includes('localhost'))
    return 'atlas-local';
  return 'atlas';
}

async function _fetchPreferencesFromCloudApi(
  projectId: string,
  atlasService: PreferencesAtlasService
): Promise<CloudPreferencesApiResponse> {
  const url = atlasService.cloudEndpoint(
    `/explorer/v1/groups/${projectId}/preferences`
  );
  const res = await atlasService.authenticatedFetch(url);
  return res.json();
}

const FEATURE_FLAG_BY_NAME = new Map<string, FeatureFlagDefinition>(
  FEATURE_FLAG_DEFINITIONS.map((f) => [f.name, f])
);

const getPermissionsFromUserRoles = (userRoles: {
  isDataAccessAdmin?: boolean;
  isDataAccessWrite?: boolean;
  isDataAccessAny?: boolean;
  isGroupIndexManager?: boolean;
}): {
  readOnly?: boolean;
  readWrite?: boolean;
  enableIndexesManagement?: boolean;
} => {
  if (userRoles?.isDataAccessAdmin) {
    return {};
  }
  // A user with the project "Index Manager" role combined with any data-access
  // role (read-only or read-write) is granted Index Management.
  const enableIndexesManagement = Boolean(
    userRoles?.isGroupIndexManager && userRoles?.isDataAccessAny
  );
  if (userRoles?.isDataAccessWrite) {
    return { readWrite: true, enableIndexesManagement };
  }
  return { readOnly: true, enableIndexesManagement };
};

/**
 * @internal Exported for testing.
 */
export async function getPreferencesFromCloudApi(
  projectId: string,
  atlasService: PreferencesAtlasService
) {
  const {
    featureFlags: featureFlagsAndPreferences,
    userAuid,
    appUser,
    currentOrganization,
    userRoles,
  } = await _fetchPreferencesFromCloudApi(projectId, atlasService);

  const atlasCloudUserPreferences: Partial<AllPreferences> = {
    atlasServiceBackendPreset: getAtlasServiceBackendPreset(),
    telemetryAtlasUserId: userAuid,
    optInGenAIFeatures: appUser.isOptedIntoDataExplorerGenAIFeatures,
    timezone: appUser.timeZoneId,
    ...getPermissionsFromUserRoles(userRoles),
  };
  const atlasCloudProjectPreferences: Partial<AllPreferences> = {};
  const atlasCloudOrgPreferences: Partial<AllPreferences> = {
    enableGenAIFeaturesAtlasOrg:
      currentOrganization.genAIFeaturesEnabled ?? false,
  };

  // Cloud feature flags arrive keyed by their Compass preference name. We
  // override Compass' value to resolve to the cloud value.
  // Note: Things we would consider preferences in Compass are feature flags in
  // mms. For instance, settings on the project that enable or disable features
  // for users of that project are feature flags in mms. As a result, the properties in
  // this `featureFlags` object are a mix of feature flags and preferences from Compass' perspective.
  for (const [name, enabled] of Object.entries(featureFlagsAndPreferences)) {
    // Filter the feature flags that are not defined in Compass' preferences schema.
    if (!isPreferenceNameValid(name)) {
      continue;
    }
    (atlasCloudUserPreferences as Record<string, unknown>)[name] = enabled;
    if (FEATURE_FLAG_BY_NAME.has(name)) {
      const scope = FEATURE_FLAG_BY_NAME.get(name)?.atlasCloudFeatureScope;
      if (scope === 'organization') {
        atlasCloudOrgPreferences[name as keyof FeatureFlags] = enabled;
      } else {
        atlasCloudProjectPreferences[name as keyof FeatureFlags] = enabled;
      }
    }
  }

  return {
    atlasCloudUserPreferences,
    atlasCloudProjectPreferences,
    atlasCloudOrgPreferences,
  };
}

async function loadCompassWebPreferences(
  projectId: string,
  atlasService: PreferencesAtlasService
): Promise<CompassWebPreferencesAccess> {
  if (!projectId) {
    throw new Error('Cannot load preferences without an Atlas project id');
  }
  const [cloudPrefs, atlasStorage] = await Promise.all([
    getPreferencesFromCloudApi(projectId, atlasService),
    (async () => {
      const storage = new AtlasPreferencesStorage(atlasService);
      await storage.setup();
      return storage;
    })(),
  ]);
  const {
    atlasCloudUserPreferences,
    atlasCloudProjectPreferences,
    atlasCloudOrgPreferences,
  } = cloudPrefs;
  return new CompassWebPreferencesAccess(
    {
      ...DEFAULT_COMPASS_WEB_PREFERENCES,
      ...atlasStorage.getPreferences(),
      ...atlasCloudUserPreferences,
      ...atlasCloudProjectPreferences,
      ...atlasCloudOrgPreferences,
    },
    {
      atlasCloudUser: atlasCloudUserPreferences,
      atlasCloudProject: atlasCloudProjectPreferences,
      atlasCloudOrg: atlasCloudOrgPreferences,
    },
    'atlas',
    atlasStorage
  );
}

export function useCompassWebPreferences(
  projectId: string,
  atlasService: PreferencesAtlasService
): {
  preferencesAccess: CompassWebPreferencesAccess | null;
  isLoading: boolean;
  error: Error | null;
} {
  const [preferencesAccess, setPreferencesAccess] =
    useState<CompassWebPreferencesAccess | null>(
      () => injectedPreferencesAccess
    );
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (injectedPreferencesAccess) {
      // An access was injected externally (sandbox override, tests); there is
      // nothing for the loader to fetch.
      return;
    }
    let mounted = true;
    void loadCompassWebPreferences(projectId, atlasService).then(
      (preferencesAccess) => {
        if (mounted) {
          setPreferencesAccess(preferencesAccess);
          // Expose the loaded access to the sandbox so e2e can read and toggle
          // preferences in Atlas Cloud mode.
          lastLoadedPreferencesAccess = preferencesAccess;
        }
      },
      (err) => {
        if (mounted) setError(err as Error);
      }
    );
    return () => {
      mounted = false;
    };
  }, [projectId, atlasService]);

  return {
    preferencesAccess,
    isLoading: !preferencesAccess && !error,
    error,
  };
}

/**
 * @internal Exported for sandbox and testing purposes. Injects a preferences
 * access that useCompassWebPreferences will render with instead of loading.
 */
export function setCompassWebPreferencesAccess(
  preferencesAccess: CompassWebPreferencesAccess | null
) {
  injectedPreferencesAccess = preferencesAccess;
}

/**
 * @internal Exported for the sandbox to expose preferences in Atlas Cloud mode.
 */
export function getAnyCompassWebPreferencesAccess(): CompassWebPreferencesAccess | null {
  return lastLoadedPreferencesAccess ?? injectedPreferencesAccess;
}
