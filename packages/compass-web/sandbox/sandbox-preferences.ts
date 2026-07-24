import { CompassWebPreferencesAccess } from 'compass-preferences-model/provider';
import {
  DEFAULT_COMPASS_WEB_PREFERENCES,
  setCompassWebPreferencesAccess,
  getAnyCompassWebPreferencesAccess,
} from '../src/preferences';

const kSandboxPreferencesAccess = Symbol.for(
  '@compass-web-sandbox-preferences-access'
);

// eslint-disable-next-line no-console
console.info(
  `[compass-web sandbox] call window[Symbol.for('@compass-web-sandbox-preferences-access')].savePreferences({}) to dynamically update preferences`
);

let sandboxPreferencesAccess: CompassWebPreferencesAccess | null = null;

Object.defineProperty(globalThis, kSandboxPreferencesAccess, {
  get() {
    // In Atlas Cloud mode sandboxPreferencesAccess is null; fall back to
    // whatever the API has loaded so that getFeature/setFeature work in e2e.
    return sandboxPreferencesAccess ?? getAnyCompassWebPreferencesAccess();
  },
});

if (Object.hasOwn(globalThis, '__compassWebEnableSandboxPreferencesOverride')) {
  sandboxPreferencesAccess = new CompassWebPreferencesAccess({
    ...DEFAULT_COMPASS_WEB_PREFERENCES,
    enablePerformanceAdvisorBanner: false,
    enableAtlasSearchIndexes: true,
    maximumNumberOfActiveConnections: undefined,
    enableCreatingNewConnections: true,
    enableGlobalWrites: false,
    enableRollingIndexes: false,
    enableGenAIFeaturesAtlasOrg: true,
    enableGenAIFeaturesAtlasProject: true,
    enableGenAISampleDocumentPassing: false,
    enableGenAIToolCallingAtlasProject: true,
    optInGenAIFeatures: false,
    enableMyQueries: false,
    telemetryAtlasUserId: 'compass_web_sandbox_telemetry_user_id',
  });
  setCompassWebPreferencesAccess(sandboxPreferencesAccess);
}
