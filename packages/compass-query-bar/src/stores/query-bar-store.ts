import type AppRegistry from 'hadron-app-registry';
import {
  createStore as _createStore,
  applyMiddleware,
  combineReducers,
} from 'redux';
import thunk from 'redux-thunk';
import type { AnyAction } from 'redux';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';

import { DEFAULT_FIELD_VALUES } from '../constants/query-bar-store';
import type { QueryProperty } from '../constants/query-properties';
import type { ChangeFilterEvent } from '../modules/change-filter';
import {
  queryBarReducer,
  INITIAL_STATE as INITIAL_QUERY_BAR_STATE,
  mapQueryToValidQueryFields,
  changeSchemaFields,
  pickValuesFromFields,
  applyFilterChange,
  applyFromHistory,
} from './query-bar-reducer';
import { aiQueryReducer } from './ai-query-reducer';

type QueryBarStoreOptions = {
  serverVersion: string;
  globalAppRegistry: AppRegistry;
  localAppRegistry: AppRegistry;
  query: Partial<Record<QueryProperty, unknown>>;
};

const rootQueryBarReducer = combineReducers({
  queryBar: queryBarReducer,
  aiQuery: aiQueryReducer,
});

export type RootState = ReturnType<typeof rootQueryBarReducer>;

export type QueryBarExtraArgs = {
  globalAppRegistry?: AppRegistry;
  localAppRegistry?: AppRegistry;
};

export type QueryBarThunkDispatch<A extends AnyAction = AnyAction> =
  ThunkDispatch<RootState, QueryBarExtraArgs, A>;

export type QueryBarThunkAction<
  R,
  A extends AnyAction = AnyAction
> = ThunkAction<R, RootState, QueryBarExtraArgs, A>;

function createStore(options: Partial<QueryBarStoreOptions> = {}) {
  const { serverVersion, localAppRegistry, globalAppRegistry, query } = options;
  return _createStore(
    rootQueryBarReducer,
    {
      queryBar: {
        ...INITIAL_QUERY_BAR_STATE,
        serverVersion: serverVersion ?? '3.6.0',
        fields: mapQueryToValidQueryFields({
          ...DEFAULT_FIELD_VALUES,
          ...query,
        }),
      },
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
    return pickValuesFromFields(store.getState().queryBar.fields);
  };

  return store as ReturnType<typeof createStore> & {
    getCurrentQuery(): unknown;
  };
}

export default configureStore;
