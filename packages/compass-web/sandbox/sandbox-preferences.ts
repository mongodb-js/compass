import { CompassWebPreferencesAccess } from 'compass-preferences-model/provider';
import {
  compassWebPreferences,
  setCompassWebPreferencesAccess,
} from '../src/preferences';

const kSandboxPreferencesAccess = Symbol.for(
  '@compass-web-sandbox-preferences-access'
);

// eslint-disable-next-line no-console
console.info(
  `[compass-web sandbox] call window[Symbol.for('@compass-web-sandbox-preferences-access')].savePreferences({}) to dynamically update preferences`
);

Object.defineProperty(globalThis, kSandboxPreferencesAccess, {
  get() {
    return compassWebPreferences ?? null;
  },
});

if (Object.hasOwn(globalThis, '__compassWebEnableSandboxPreferencesOverride')) {
  setCompassWebPreferencesAccess(
    new CompassWebPreferencesAccess({
      enableExportSchema: true,
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
      enableDataModelingCollapse: true,
      enableMyQueries: false,
      telemetryAtlasUserId: 'compass_web_sandbox_telemetry_user_id',
    })
  );
}
