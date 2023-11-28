import AppRegistry from 'hadron-app-registry';
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
      ...options,
    },
    {
      dataService,
      ...appRegistries,
    }
  ).store;
}
