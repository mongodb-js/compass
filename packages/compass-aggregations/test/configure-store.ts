import AppRegistry, { createActivateHelpers } from 'hadron-app-registry';
import type {
  AggregationsPluginServices,
  ConfigureStoreOptions,
} from '../src/stores/store';
import { activateAggregationsPlugin } from '../src/stores/store';
import { mockDataService } from './mocks/data-service';
import type { DataService } from '../src/modules/data-service';
import { ReadOnlyPreferenceAccess } from 'compass-preferences-model/provider';
import { createNoopLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import { AtlasService } from '@mongodb-js/atlas-service/renderer';
import { AtlasAiService } from '@mongodb-js/compass-generative-ai';

export class MockAtlasUserData {
  getUser = () => Promise.resolve({} as any);
  updateConfig = () => Promise.resolve();
}
export class MockAtlasAuthService {
  on() {
    return this;
  }
  signIn() {
    return Promise.resolve({});
  }
}

export default function configureStore(
  options: Partial<ConfigureStoreOptions> = {},
  dataService: DataService = mockDataService(),
  services: Partial<AggregationsPluginServices> = {}
) {
  AtlasAiService['instance'] = null;
  const preferences = new ReadOnlyPreferenceAccess();
  const logger = createNoopLoggerAndTelemetry();
  const atlasService =
    services.atlasService ||
    new AtlasService(new MockAtlasUserData(), preferences, logger);
  const atlasAuthService =
    options.atlasAuthService || (new MockAtlasAuthService() as any);
  return activateAggregationsPlugin(
    {
      namespace: 'test.test',
      isReadonly: false,
      isTimeSeries: false,
      isClustered: false,
      isFLE: false,
      isSearchIndexesSupported: false,
      isDataLake: false,
      isAtlas: false,
      serverVersion: '4.0.0',
      ...options,
      atlasAuthService,
    },
    {
      dataService,
      instance: {} as any,
      preferences,
      globalAppRegistry: new AppRegistry(),
      localAppRegistry: new AppRegistry(),
      workspaces: {} as any,
      logger,
      ...services,
      atlasService,
    },
    createActivateHelpers()
  ).store;
}
