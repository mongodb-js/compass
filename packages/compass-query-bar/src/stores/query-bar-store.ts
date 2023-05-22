import type AppRegistry from 'hadron-app-registry';
import { createStore as _createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { DEFAULT_FIELD_VALUES } from '../constants/query-bar-store';
import type { QueryProperty } from '../constants/query-properties';
import type { ChangeFilterEvent } from '../modules/change-filter';
import {
  queryBarReducer,
  INITIAL_STATE,
  mapQueryToValidQueryFields,
  changeSchemaFields,
  pickValuesFromFields,
  applyFilterChange,
  applyFromHistory,
} from './query-bar-reducer';

type QueryBarStoreOptions = {
  serverVersion: string;
  globalAppRegistry: AppRegistry;
  localAppRegistry: AppRegistry;
  query: Partial<Record<QueryProperty, unknown>>;
};

function createStore(options: Partial<QueryBarStoreOptions> = {}) {
  const { serverVersion, localAppRegistry, globalAppRegistry, query } = options;
  return _createStore(
    queryBarReducer,
    {
      ...INITIAL_STATE,
      serverVersion: serverVersion ?? '3.6.0',
      fields: mapQueryToValidQueryFields({ ...DEFAULT_FIELD_VALUES, ...query }),
    },
    applyMiddleware(
      thunk.withExtraArgument({ localAppRegistry, globalAppRegistry })
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

  localAppRegistry?.on('query-history-run-query', (query) => {
    store.dispatch(applyFromHistory(query));
  });

  (store as any).getCurrentQuery = () => {
    return pickValuesFromFields(store.getState().fields);
  };

  return store as ReturnType<typeof createStore> & {
    getCurrentQuery(): unknown;
  };
}

export default configureStore;
