import AppRegistry, { createActivateHelpers } from 'hadron-app-registry';
import type { ConfigureStoreOptions } from '../src/stores/store';
import { activateAggregationsPlugin } from '../src/stores/store';
import { mockDataService } from './mocks/data-service';
import type { DataService } from '../src/modules/data-service';

export default function configureStore(
  options: Partial<ConfigureStoreOptions> = {},
  dataService: DataService = mockDataService(),
  appRegistries: {
    globalAppRegistry: AppRegistry;
    localAppRegistry: AppRegistry;
  } = {
    globalAppRegistry: new AppRegistry(),
    localAppRegistry: new AppRegistry(),
  }
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
      instance: {},
      ...appRegistries,
    } as any,
    createActivateHelpers()
  ).store;
}
