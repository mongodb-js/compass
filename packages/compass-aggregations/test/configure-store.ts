import type {
  AggregationsPluginServices,
  ConfigureStoreOptions,
} from '../src/stores/store';
import { mockDataService } from './mocks/data-service';
import { AtlasAuthService } from '@mongodb-js/atlas-service/provider';
import {
  activatePluginWithActiveConnection,
  renderPluginComponentWithActiveConnection,
} from '@mongodb-js/compass-connections/test';
import { CompassAggregationsHadronPlugin } from '../src/index';
import type { DataService } from '@mongodb-js/compass-connections/provider';
import React from 'react';
import { PipelineStorageProvider } from '@mongodb-js/my-queries-storage/provider';

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

function getMockedPluginArgs(
  initialProps: Partial<ConfigureStoreOptions> = {},
  dataService: Partial<DataService> = mockDataService(),
  services: Partial<AggregationsPluginServices> = {}
) {
  const atlasAuthService = new MockAtlasAuthService();
  const atlasAiService = new MockAtlasAiService();
  return [
    CompassAggregationsHadronPlugin.withMockServices({
      atlasAuthService,
      atlasAiService,
      collection: {
        toJSON: () => ({}),
        on: () => {},
        removeListener: () => {},
      } as any,
      ...services,
    } as any),
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
      ...initialProps,
    },
    {
      id: 'TEST',
      connectionOptions: {
        connectionString: 'mongodb://localhost:27020',
      },
    },
    {
      connectFn() {
        return dataService;
      },
      preferences: services.preferences
        ? services.preferences.getPreferences()
        : undefined,
    },
  ] as unknown as Parameters<typeof activatePluginWithActiveConnection>;
}

/**
 * @deprecated use renderWithStore and test store through UI instead
 */
export default function configureStore(
  ...args: Parameters<typeof getMockedPluginArgs>
) {
  return activatePluginWithActiveConnection(...getMockedPluginArgs(...args));
}

export function renderWithStore(
  ui: React.ReactElement,
  ...args: Parameters<typeof configureStore>
) {
  ui = args[2]?.pipelineStorage
    ? React.createElement(PipelineStorageProvider, {
        value: args[2].pipelineStorage,
        children: ui,
      })
    : ui;

  return renderPluginComponentWithActiveConnection(
    ui,
    ...getMockedPluginArgs(...args)
  );
}
