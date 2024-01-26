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

export default function configureStore(
  options: Partial<ConfigureStoreOptions> = {},
  dataService: DataService = mockDataService(),
  services: Partial<AggregationsPluginServices> = {}
) {
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
      preferences: new ReadOnlyPreferenceAccess(),
      globalAppRegistry: new AppRegistry(),
      localAppRegistry: new AppRegistry(),
      workspaces: {} as any,
      logger: createNoopLoggerAndTelemetry(),
      atlasService: new AtlasService(),
      ...services,
    },
    createActivateHelpers()
  ).store;
}
