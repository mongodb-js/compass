import AppRegistry, { createActivateHelpers } from 'hadron-app-registry';
import type {
  AggregationsPluginServices,
  ConfigureStoreOptions,
} from '../src/stores/store';
import { activateAggregationsPlugin } from '../src/stores/store';
import { mockDataService } from './mocks/data-service';
import type { DataService } from '../src/modules/data-service';
import { defaultPreferencesInstance } from 'compass-preferences-model';

export default function configureStore(
  options: Partial<ConfigureStoreOptions> = {},
  dataService: DataService = mockDataService(),
  appRegistries: Partial<AggregationsPluginServices> = {}
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
      preferences: defaultPreferencesInstance,
      globalAppRegistry: new AppRegistry(),
      localAppRegistry: new AppRegistry(),
      workspaces: {} as any,
      ...appRegistries,
    },
    createActivateHelpers()
  ).store;
}
