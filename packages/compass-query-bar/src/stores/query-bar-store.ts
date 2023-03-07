import type AppRegistry from 'hadron-app-registry';
import { createStore, applyMiddleware } from 'redux';
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
} from './query-bar-reducer';

type QueryBarStoreOptions = {
  serverVersion: string;
  globalAppRegistry: AppRegistry;
  localAppRegistry: AppRegistry;
  query: Record<QueryProperty, unknown>;
};

function configureStore(options: QueryBarStoreOptions) {
  const { serverVersion, localAppRegistry, globalAppRegistry, query } = options;

  const store = createStore(
    queryBarReducer,
    {
      ...INITIAL_STATE,
      serverVersion: serverVersion,
      fields: mapQueryToValidQueryFields({ ...DEFAULT_FIELD_VALUES, ...query }),
    },
    applyMiddleware(
      thunk.withExtraArgument({ localAppRegistry, globalAppRegistry })
    )
  );

  localAppRegistry.on('fields-changed', (fields) => {
    store.dispatch(changeSchemaFields(fields.aceFields));
  });

  localAppRegistry.on('query-bar-change-filter', (evt: ChangeFilterEvent) => {
    console.log(evt);
    store.dispatch(applyFilterChange(evt));
  });

  (store as any).getCurrentQuery = () => {
    return pickValuesFromFields(store.getState().fields);
  };

  return store;
}

export default configureStore;
