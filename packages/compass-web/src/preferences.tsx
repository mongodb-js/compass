import {
  CompassWebPreferencesAccess,
  featureFlags as FEATURE_FLAG_DEFINITIONS,
  isPreferenceNameValid,
  type AllPreferences,
  type FeatureFlagDefinition,
  type FeatureFlags,
} from 'compass-preferences-model/provider';
import { useEffect, useState } from 'react';
import { defaultHeaders } from './url-builder';

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

const compassWebPreferencesCache = new Map<
  string, // Project id.
  CompassWebPreferencesAccess | Promise<CompassWebPreferencesAccess>
>();

function getCachedPreferences(
  projectId: string
): CompassWebPreferencesAccess | null {
  const cached = compassWebPreferencesCache.get(projectId);
  // When we're still loading preferences this will be a promise, so we return
  // null to indicate we should be in a loading state.
  return cached instanceof CompassWebPreferencesAccess ? cached : null;
}

// These are resolved from the mms API getDataExplorerPreferences endpoint.
// See DataExplorerPreferencesView for parity.
type CloudPreferencesApiResponse = {
  featureFlags: Record<string, boolean>;
  userAuid: string;
  appUser: {
    isOptedIntoDataExplorerGenAIFeatures: boolean;
  };
  userRoles: {
    isDataAccessAdmin?: boolean;
    isDataAccessWrite?: boolean;
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

// We fetch here and not in atlas-service because atlas-service depends on these
// preferences; the request has to happen before atlas-service can be set up.
async function _fetchPreferencesFromCloudApi(
  projectId: string
): Promise<CloudPreferencesApiResponse> {
  const res = await fetch(`/explorer/v1/groups/${projectId}/preferences`, {
    headers: defaultHeaders,
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(
      `Failed to fetch preferences: ${res.status} ${res.statusText}`
    );
  }
  return res.json();
}

const FEATURE_FLAG_BY_NAME = new Map<string, FeatureFlagDefinition>(
  FEATURE_FLAG_DEFINITIONS.map((f) => [f.name, f])
);

const getPermissionsFromUserRoles = (userRoles: {
  isDataAccessAdmin?: boolean;
  isDataAccessWrite?: boolean;
}): {
  readOnly?: boolean;
  readWrite?: boolean;
} => {
  if (userRoles?.isDataAccessAdmin) {
    return {};
  }
  if (userRoles?.isDataAccessWrite) {
    return { readWrite: true };
  }
  return { readOnly: true };
};

/**
 * @internal Exported for testing.
 */
export async function getPreferencesFromCloudApi(projectId: string) {
  const {
    featureFlags: featureFlagsAndPreferences,
    userAuid,
    appUser,
    currentOrganization,
    userRoles,
  } = await _fetchPreferencesFromCloudApi(projectId);

  const atlasCloudUserPreferences: Partial<AllPreferences> = {
    atlasServiceBackendPreset: getAtlasServiceBackendPreset(),
    telemetryAtlasUserId: userAuid,
    optInGenAIFeatures: appUser.isOptedIntoDataExplorerGenAIFeatures,
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

async function _fetchAndCachePreferences(
  projectId: string
): Promise<CompassWebPreferencesAccess> {
  try {
    const {
      atlasCloudUserPreferences,
      atlasCloudProjectPreferences,
      atlasCloudOrgPreferences,
    } = await getPreferencesFromCloudApi(projectId);
    const preferencesAccess = new CompassWebPreferencesAccess(
      {
        ...DEFAULT_COMPASS_WEB_PREFERENCES,
        ...atlasCloudUserPreferences,
      },
      {
        atlasCloudUser: atlasCloudUserPreferences,
        atlasCloudProject: atlasCloudProjectPreferences,
        atlasCloudOrg: atlasCloudOrgPreferences,
      }
    );
    // Replace the pending promise with the resolved access so a remount can
    // pick it up synchronously without a loading state.
    compassWebPreferencesCache.set(projectId, preferencesAccess);
    return preferencesAccess;
  } catch (err) {
    // Drop the failed entry so a remount can retry the fetch.
    compassWebPreferencesCache.delete(projectId);
    throw err;
  }
}

async function loadCompassWebPreferences(
  projectId: string
): Promise<CompassWebPreferencesAccess> {
  const cached = compassWebPreferencesCache.get(projectId);
  if (cached) {
    return cached;
  }
  if (!projectId) {
    throw new Error('Cannot load preferences without an Atlas project id');
  }
  // Cache the in-flight promise so concurrent callers share one request.
  const preferences = _fetchAndCachePreferences(projectId);
  compassWebPreferencesCache.set(projectId, preferences);
  return preferences;
}

// Start fetching as early as possible, before Compass is rendered, so the
// preferences are ready or in flight by the time it mounts.
export function prefetchCompassWebPreferences(): void {
  const projectId = getProjectIdFromUrl();
  if (projectId) {
    void loadCompassWebPreferences(projectId);
  }
}

export function useCompassWebPreferences(projectId: string): {
  preferencesAccess: CompassWebPreferencesAccess | null;
  isLoading: boolean;
  error: Error | null;
} {
  const [preferencesAccess, setPreferencesAccess] =
    useState<CompassWebPreferencesAccess | null>(() =>
      getCachedPreferences(projectId)
    );
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    // On a cache hit this resolves immediately with the same instance the
    // state was initialized with so it won't trigger a re-render.
    void loadCompassWebPreferences(projectId).then(
      (preferencesAccess) => {
        if (mounted) setPreferencesAccess(preferencesAccess);
      },
      (err) => {
        if (mounted) setError(err as Error);
      }
    );
    return () => {
      mounted = false;
    };
  }, [projectId]);

  return {
    preferencesAccess,
    isLoading: !preferencesAccess && !error,
    error,
  };
}

/**
 * @internal Exported for sandbox and testing purposes.
 */
export function setCompassWebPreferencesAccess(
  preferencesAccess: CompassWebPreferencesAccess,
  projectId = ''
) {
  compassWebPreferencesCache.set(projectId, preferencesAccess);
}

/**
 * @internal Exported for the sandbox to expose preferences in Atlas Cloud mode.
 * Returns the first resolved CompassWebPreferencesAccess from any cached entry.
 */
export function getAnyCompassWebPreferencesAccess(): CompassWebPreferencesAccess | null {
  for (const cached of compassWebPreferencesCache.values()) {
    if (cached instanceof CompassWebPreferencesAccess) {
      return cached;
    }
  }
  return null;
}
