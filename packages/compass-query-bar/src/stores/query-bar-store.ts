import type AppRegistry from '@mongodb-js/compass-app-registry';
import {
  createStore as _createStore,
  applyMiddleware,
  combineReducers,
} from 'redux';
import thunk from 'redux-thunk';
import type { AnyAction } from 'redux';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';
import type {
  ConnectionInfoRef,
  DataService,
} from '@mongodb-js/compass-connections/provider';
import { getDefaultFormFields } from '../utils/query';
import { toJSString } from '@mongodb-js/shell-bson-parser';
import { prettify } from '@mongodb-js/compass-editor';
import { QUERY_PROPERTIES } from '../constants/query-properties';
import {
  queryBarReducer,
  INITIAL_STATE as INITIAL_QUERY_BAR_STATE,
  QueryBarActions,
  fetchSavedQueries,
  setQuery,
} from './query-bar-reducer';
import { aiQueryReducer } from './ai-query-reducer';
import { getQueryAttributes } from '../utils';
import type { PreferencesAccess } from '@mongodb-js/compass-preferences-model';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';
import type { ActivateHelpers } from '@mongodb-js/compass-app-registry';
import type { MongoDBInstance } from '@mongodb-js/mongodb-instance-model';
import { QueryBarStoreContext } from './context';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import type { AtlasAiService } from '@mongodb-js/compass-generative-ai/provider';
import type {
  FavoriteQueryStorageAccess,
  FavoriteQueryStorage,
  RecentQueryStorageAccess,
  RecentQueryStorage,
} from '@mongodb-js/my-queries-storage/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import type Collection from '@mongodb-js/mongodb-collection-model';

// Partial of DataService that mms shares with Compass.
type FetchCollectionMetadataDataServiceMethods =
  | 'collectionStats'
  | 'collectionInfo'
  | 'listCollections'
  | 'isListSearchIndexesSupported';
type QueryBarDataService = Pick<
  DataService,
  'sample' | 'getConnectionString' | FetchCollectionMetadataDataServiceMethods
>;

type QueryBarServices = {
  instance: MongoDBInstance;
  globalAppRegistry: AppRegistry;
  localAppRegistry: AppRegistry;
  dataService: QueryBarDataService;
  preferences: PreferencesAccess;
  logger: Logger;
  track: TrackFunction;
  connectionInfoRef: ConnectionInfoRef;
  atlasAiService: AtlasAiService;
  favoriteQueryStorageAccess?: FavoriteQueryStorageAccess;
  recentQueryStorageAccess?: RecentQueryStorageAccess;
  collection: Collection;
};

// TODO(COMPASS-7412): this doesn't have service injector
// implemented yet, so we're keeping it separate from the type above
type QueryBarExtraServices = {
  atlasAIService?: AtlasAiService;
  favoriteQueryStorage?: FavoriteQueryStorage;
  recentQueryStorage?: RecentQueryStorage;
};

export type QueryBarStoreOptions = CollectionTabPluginMetadata;

export const rootQueryBarReducer = combineReducers({
  queryBar: queryBarReducer,
  aiQuery: aiQueryReducer,
});

export type RootState = ReturnType<typeof rootQueryBarReducer>;

export type QueryBarExtraArgs = {
  globalAppRegistry: AppRegistry;
  localAppRegistry: AppRegistry;
  dataService: Pick<
    QueryBarDataService,
    'sample' | FetchCollectionMetadataDataServiceMethods
  >;
  preferences: PreferencesAccess;
  favoriteQueryStorage?: FavoriteQueryStorage;
  recentQueryStorage?: RecentQueryStorage;
  logger: Logger;
  track: TrackFunction;
  connectionInfoRef: ConnectionInfoRef;
  atlasAiService: AtlasAiService;
  collection: Collection;
};

export type QueryBarThunkDispatch<A extends AnyAction = AnyAction> =
  ThunkDispatch<RootState, QueryBarExtraArgs, A>;

export type QueryBarThunkAction<
  R,
  A extends AnyAction = AnyAction,
> = ThunkAction<R, RootState, QueryBarExtraArgs, A>;

export function configureStore(
  initialState: Partial<RootState['queryBar']> = {},
  services: QueryBarExtraArgs
) {
  return _createStore(
    rootQueryBarReducer,
    {
      queryBar: {
        ...INITIAL_QUERY_BAR_STATE,
        ...initialState,
      },
    },
    applyMiddleware(thunk.withExtraArgument(services))
  );
}

export function activatePlugin(
  options: QueryBarStoreOptions,
  services: QueryBarServices & QueryBarExtraServices,
  { on, cleanup }: ActivateHelpers
) {
  const { serverVersion, query, namespace } = options;

  const {
    localAppRegistry,
    globalAppRegistry,
    instance,
    dataService,
    preferences,
    logger,
    track,
    connectionInfoRef,
    atlasAiService,
    favoriteQueryStorageAccess,
    recentQueryStorageAccess,
    collection,
  } = services;

  const favoriteQueryStorage = favoriteQueryStorageAccess?.getStorage();
  const recentQueryStorage = recentQueryStorageAccess?.getStorage();

  const initialQuery = getQueryAttributes(query ?? {});
  const fields = getDefaultFormFields();
  // If the query is set, we want to populate the form
  // fields, but we can not validate it at this point.
  // Immediately after the store is created, we dispatch
  // setQuery action which validates it.
  for (const property of QUERY_PROPERTIES) {
    if (property in initialQuery) {
      const value = initialQuery[property as keyof typeof initialQuery];
      fields[property].string = prettify(
        typeof value === 'undefined' ? '' : toJSString(value, 0) || '',
        'javascript-expression'
      );
    }
  }

  const store = configureStore(
    {
      namespace: namespace ?? '',
      host: dataService?.getConnectionString().hosts.join(','),
      serverVersion: serverVersion ?? '3.6.0',
      fields,
      isReadonlyConnection: !instance.isWritable,
    },
    {
      dataService: services.dataService ?? {
        sample: () => {
          /* no-op for environments where dataService is not provided at all. */
          return Promise.resolve([]);
        },
      },
      localAppRegistry,
      globalAppRegistry,
      recentQueryStorage,
      favoriteQueryStorage,
      preferences,
      logger,
      track,
      connectionInfoRef,
      atlasAiService,
      collection,
    }
  );

  // If we have an initial query, dispatch it to the store
  // so that its validated.
  if (Object.keys(initialQuery).length > 0) {
    void store.dispatch(setQuery(initialQuery));
  }

  on(instance, 'change:isWritable', () => {
    store.dispatch({
      type: QueryBarActions.ChangeReadonlyConnectionStatus,
      readonly: !instance.isWritable,
    });
  });

  on(localAppRegistry, 'explain-plan-interpret-started', () => {
    store.dispatch({ type: QueryBarActions.InterpretStarted });
  });

  on(localAppRegistry, 'explain-plan-interpret-finished', () => {
    store.dispatch({ type: QueryBarActions.InterpretFinished });
  });

  store.dispatch(fetchSavedQueries());

  return { store, deactivate: cleanup, context: QueryBarStoreContext };
}
