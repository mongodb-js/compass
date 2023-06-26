import type AppRegistry from 'hadron-app-registry';
import { createStore as _createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { DEFAULT_FIELD_VALUES } from '../constants/query-bar-store';
import type { BaseQuery } from '../constants/query-properties';
import { mapFormFieldsToQuery, mapQueryToFormFields } from '../utils/query';
import type { ChangeFilterEvent } from '../modules/change-filter';
import {
  queryBarReducer,
  INITIAL_STATE,
  changeSchemaFields,
  applyFilterChange,
} from './query-bar-reducer';
import {
  FavoriteQueryStorage,
  RecentQueryStorage,
  getQueryAttributes,
} from '../utils';
import { getStoragePaths } from '@mongodb-js/compass-utils';
const { basepath } = getStoragePaths() || {};

type QueryBarStoreOptions = {
  serverVersion: string;
  globalAppRegistry: AppRegistry;
  localAppRegistry: AppRegistry;
  query: BaseQuery;
  namespace: string;
  dataProvider: {
    dataProvider?: {
      getConnectionString: () => {
        hosts: string[];
      };
    };
  };
};

function createStore(options: Partial<QueryBarStoreOptions> = {}) {
  const {
    serverVersion,
    localAppRegistry,
    globalAppRegistry,
    query,
    namespace,
    dataProvider,
  } = options;

  const recentQueryStorage = new RecentQueryStorage(basepath, namespace);
  const favoriteQueryStorage = new FavoriteQueryStorage(basepath, namespace);

  return _createStore(
    queryBarReducer,
    {
      ...INITIAL_STATE,
      namespace: namespace ?? '',
      host: dataProvider?.dataProvider?.getConnectionString().hosts.join(','),
      serverVersion: serverVersion ?? '3.6.0',
      fields: mapQueryToFormFields({
        ...DEFAULT_FIELD_VALUES,
        ...getQueryAttributes(query ?? {}),
      }),
    },
    applyMiddleware(
      thunk.withExtraArgument({
        localAppRegistry,
        globalAppRegistry,
        recentQueryStorage,
        favoriteQueryStorage,
      })
    )
  );
}

export function configureStore(options: Partial<QueryBarStoreOptions> = {}) {
  const { localAppRegistry } = options;

  const store = createStore(options);

  localAppRegistry?.on('fields-changed', (fields) => {
    store.dispatch(changeSchemaFields(fields.autocompleteFields));
  });

  localAppRegistry?.on('query-bar-change-filter', (evt: ChangeFilterEvent) => {
    store.dispatch(applyFilterChange(evt));
  });

  (store as any).getCurrentQuery = () => {
    return mapFormFieldsToQuery(store.getState().fields);
  };

  return store as ReturnType<typeof createStore> & {
    getCurrentQuery(): unknown;
  };
}

export default configureStore;
