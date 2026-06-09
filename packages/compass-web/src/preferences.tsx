import {
  CompassWebPreferencesAccess,
  featureFlags as FEATURE_FLAG_DEFINITIONS,
  type AllPreferences,
  type FeatureFlagDefinition,
  type FeatureFlags,
} from 'compass-preferences-model/provider';
import { useEffect, useState } from 'react';
import { throwIfNotOk } from '@mongodb-js/atlas-service/provider';
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

let compassWebPreferencesPromise: Promise<CompassWebPreferencesAccess> | null =
  null;
/**
 * @internal
 * exported for the sandbox to be able to hook into these
 */
export let compassWebPreferences: CompassWebPreferencesAccess | null = null;

// These are resolved from the mms API getDataExplorerPreferences endpoint.
// See DataExplorerPreferencesView for parity.
type CloudPreferencesApiResponse = {
  featureFlags: Record<string, boolean>;
  userAuid: string;
  appUser: {
    isOptedIntoDataExplorerGenAIFeatures: boolean;
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
  await throwIfNotOk(res);
  return res.json();
}

const FEATURE_FLAG_BY_NAME = new Map<string, FeatureFlagDefinition>(
  FEATURE_FLAG_DEFINITIONS.map((f) => [f.name, f])
);

export async function getPreferencesFromCloudApi(projectId: string) {
  const { featureFlags, userAuid, appUser, currentOrganization } =
    await _fetchPreferencesFromCloudApi(projectId);

  const preferences: Partial<AllPreferences> = {
    atlasServiceBackendPreset: getAtlasServiceBackendPreset(),
    telemetryAtlasUserId: userAuid,
    optInGenAIFeatures: appUser.isOptedIntoDataExplorerGenAIFeatures,
    enableGenAIFeaturesAtlasOrg:
      currentOrganization.genAIFeaturesEnabled ?? false,
  };
  const atlasCloudProjectFeatureFlags: Partial<FeatureFlags> = {};
  const atlasCloudOrgFeatureFlags: Partial<FeatureFlags> = {};

  // Cloud feature flags arrive keyed by their Compass preference name. We
  // override Compass' value to resolve to the cloud value.
  for (const [name, enabled] of Object.entries(featureFlags)) {
    (preferences as Record<string, unknown>)[name] = enabled;
    if (FEATURE_FLAG_BY_NAME.has(name)) {
      const scope = FEATURE_FLAG_BY_NAME.get(name)?.atlasCloudFeatureScope;
      if (scope === 'organization') {
        atlasCloudOrgFeatureFlags[name as keyof FeatureFlags] = enabled;
      } else {
        atlasCloudProjectFeatureFlags[name as keyof FeatureFlags] = enabled;
      }
    }
  }

  return {
    preferences,
    atlasCloudUserFeatureFlags: {
      /* There aren't any user scope feature flags in Atlas. */
    },
    atlasCloudProjectFeatureFlags,
    atlasCloudOrgFeatureFlags,
  };
}

async function fetchAndCachePreferences(
  projectId: string
): Promise<CompassWebPreferencesAccess> {
  try {
    const {
      preferences,
      atlasCloudUserFeatureFlags,
      atlasCloudProjectFeatureFlags,
      atlasCloudOrgFeatureFlags,
    } = await getPreferencesFromCloudApi(projectId);
    compassWebPreferences = new CompassWebPreferencesAccess(
      {
        ...DEFAULT_COMPASS_WEB_PREFERENCES,
        ...preferences,
      },
      {
        atlasCloudUser: atlasCloudUserFeatureFlags,
        atlasCloudProject: atlasCloudProjectFeatureFlags,
        atlasCloudOrg: atlasCloudOrgFeatureFlags,
      }
    );
    return compassWebPreferences;
  } catch (err) {
    compassWebPreferencesPromise = null;
    throw err;
  }
}

function loadCompassWebPreferences(
  projectId: string
): Promise<CompassWebPreferencesAccess> {
  compassWebPreferencesPromise ??= fetchAndCachePreferences(projectId);
  return compassWebPreferencesPromise;
}

// Start fetching as early as possible, before Compass is rendered, so the
// preferences are ready or in flight by the time it mounts.
export function prefetchCompassWebPreferences(): void {
  const projectId = getProjectIdFromUrl();
  if (!compassWebPreferences && projectId) {
    void loadCompassWebPreferences(projectId);
  }
}

export function useCompassWebPreferences(): {
  preferencesAccess: CompassWebPreferencesAccess | null;
  isLoading: boolean;
  error: Error | null;
} {
  const [preferencesAccess, setPreferencesAccess] =
    useState<CompassWebPreferencesAccess | null>(compassWebPreferences);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (preferencesAccess) {
      return;
    }
    const projectId = getProjectIdFromUrl();
    const preferences = projectId
      ? loadCompassWebPreferences(projectId)
      : Promise.reject(
          new Error('Could not determine the Atlas project id from the URL')
        );
    void preferences.then(setPreferencesAccess, (err) =>
      setError(err as Error)
    );
  }, [preferencesAccess]);

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
  preferencesAccess: CompassWebPreferencesAccess
) {
  compassWebPreferences = preferencesAccess;
  compassWebPreferencesPromise = Promise.resolve(preferencesAccess);
}
