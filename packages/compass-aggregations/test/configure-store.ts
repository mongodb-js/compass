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
import { AtlasAuthService } from '@mongodb-js/atlas-service/provider';
import { TEST_CONNECTION_INFO } from '@mongodb-js/compass-connections/provider';
import type Collection from 'mongodb-collection-model';

export class MockAtlasAuthService extends AtlasAuthService {
  isAuthenticated() {
    return Promise.resolve(true);
  }
  async getUserInfo() {
    return Promise.resolve({} as any);
  }
  async signIn() {
    return Promise.resolve({} as any);
  }
  async signOut() {
    return Promise.resolve();
  }
  getAuthHeaders() {
    return Promise.resolve({});
  }
}

export class MockAtlasAiService {
  async getAggregationFromUserInput() {
    return Promise.resolve({});
  }
  async getQueryFromUserInput() {
    return Promise.resolve({});
  }
}

export default function configureStore(
  options: Partial<ConfigureStoreOptions> = {},
  dataService: DataService = mockDataService(),
  services: Partial<AggregationsPluginServices> = {}
) {
  const preferences = new ReadOnlyPreferenceAccess();
  const logger = createNoopLoggerAndTelemetry();

  const atlasAuthService = new MockAtlasAuthService();
  const atlasAiService = new MockAtlasAiService();

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
    },
    {
      dataService,
      instance: {} as any,
      preferences,
      globalAppRegistry: new AppRegistry(),
      localAppRegistry: new AppRegistry(),
      workspaces: {} as any,
      logger,
      atlasAiService: atlasAiService as any,
      atlasAuthService,
      connectionInfoAccess: {
        getCurrentConnectionInfo() {
          return TEST_CONNECTION_INFO;
        },
      },
      collection: {
        toJSON: () => ({}),
        on: () => {},
      } as any,
      ...services,
    },
    createActivateHelpers()
  ).store;
}
