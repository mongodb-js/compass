import type {
  AggregationsPluginServices,
  ConfigureStoreOptions,
} from '../src/stores/store';
import { mockDataService } from './mocks/data-service';
import { createPluginTestHelpers } from '@mongodb-js/testing-library-compass';
import { CompassAggregationsPlugin } from '../src/index';
import type { DataService } from '@mongodb-js/compass-connections/provider';
import React from 'react';
import { PipelineStorageProvider } from '@mongodb-js/my-queries-storage/provider';

export class MockAtlasAiService {
  async getAggregationFromUserInput() {
    return Promise.resolve({});
  }
  async getQueryFromUserInput() {
    return Promise.resolve({});
  }
  async ensureAiFeatureAccess() {
    return Promise.resolve();
  }
}

function getMockedPluginArgs(
  initialProps: Partial<ConfigureStoreOptions> = {},
  dataService: Partial<DataService> = mockDataService(),
  services: Partial<AggregationsPluginServices> = {}
) {
  const atlasAiService = new MockAtlasAiService();
  return [
    CompassAggregationsPlugin.provider.withMockServices({
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
  ] as const;
}

/**
 * @deprecated use renderWithStore and test store through UI instead
 */
export default function configureStore(
  ...args: Parameters<typeof getMockedPluginArgs>
) {
  const [Plugin, initialProps, connectionInfo, renderOptions] =
    getMockedPluginArgs(...args);
  const { activatePluginWithActiveConnection } =
    createPluginTestHelpers(Plugin);
  return activatePluginWithActiveConnection(
    connectionInfo,
    initialProps,
    renderOptions
  );
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

  const [Plugin, initialProps, connectionInfo, renderOptions] =
    getMockedPluginArgs(...args);
  const { renderWithActiveConnection } = createPluginTestHelpers(
    Plugin,
    initialProps
  );
  return renderWithActiveConnection(ui, connectionInfo, renderOptions);
}
