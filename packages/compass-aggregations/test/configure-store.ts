import type { ConfigureStoreOptions } from '../src/stores/store';
import { default as _configureStore } from '../src/stores/store';
import { mockDataService } from './mocks/data-service';

export default function configureStore(
  options: Partial<ConfigureStoreOptions> = {}
) {
  return _configureStore({
    dataProvider: { dataProvider: mockDataService() },
    namespace: 'test.test',
    ...options,
  });
}
