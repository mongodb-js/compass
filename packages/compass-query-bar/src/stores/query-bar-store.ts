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
import { DEFAULT_FIELD_VALUES } from '../constants/query-bar-store';
import { mapFormFieldsToQuery, mapQueryToFormFields } from '../utils/query';
import {
  queryBarReducer,
  INITIAL_STATE as INITIAL_QUERY_BAR_STATE,
  QueryBarActions,
  fetchSavedQueries,
  renameLoadedFavorite,
} from './query-bar-reducer';
import { aiQueryReducer } from './ai-query-reducer';
import { getQueryAttributes, isQueryEqual } from '../utils';
import {
  LOADED_FAVORITE_EVENT,
  LOADED_FAVORITE_RENAME_KEY,
  LOADED_FAVORITE_STICKY_KEY,
  type LoadedFavoritePayload,
  type RenameLoadedFavorite,
} from '../loaded-favorite-bridge';
import type { PreferencesAccess } from 'compass-preferences-model';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';
import type { ActivateHelpers } from '@mongodb-js/compass-app-registry';
import type { MongoDBInstance } from 'mongodb-instance-model';
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
import type Collection from 'mongodb-collection-model';

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
  A extends AnyAction = AnyAction
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
  { on, cleanup, addCleanup }: ActivateHelpers
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

  const store = configureStore(
    {
      namespace: namespace ?? '',
      host: dataService?.getConnectionString().hosts.join(','),
      serverVersion: serverVersion ?? '3.6.0',
      fields: mapQueryToFormFields(preferences.getPreferences(), {
        ...DEFAULT_FIELD_VALUES,
        ...getQueryAttributes(query ?? {}),
      }),
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

  on(instance, 'change:isWritable', () => {
    store.dispatch({
      type: QueryBarActions.ChangeReadonlyConnectionStatus,
      readonly: !instance.isWritable,
    });
  });

  store.dispatch(fetchSavedQueries());

  // ── Loaded-favorite bridge ────────────────────────────────────────
  // Broadcast the current loaded-favorite identity + dirty state on
  // every relevant store change, so consumers outside the query-bar
  // package (e.g. the collection-header breadcrumb) can show
  // "<connection> > <db> > <coll> > <saved query name> *" without
  // taking a circular dep on @mongodb-js/compass-query-bar.
  //
  // We dedupe by shallow-comparing the previous payload — the store
  // emits on every keystroke in the filter input, but the consumer
  // only cares when the *name* or the *isDirty* flag flips.
  //
  // `lastBroadcast` starts as `null` (rather than the empty payload)
  // so the very first call always populates the sticky slot and
  // emits, even when there's no favorite loaded. Otherwise the
  // sticky property never gets written until a favorite is actually
  // loaded — and late-subscribing consumers read `undefined` and have
  // to wait for the next state change.
  let lastBroadcast: LoadedFavoritePayload | null = null;
  const broadcastLoadedFavorite = () => {
    const state = store.getState();
    const loadedId = state.queryBar.loadedFavoriteId;
    let payload: LoadedFavoritePayload = { name: null, isDirty: false };
    if (loadedId) {
      const fav = state.queryBar.favoriteQueries.find(
        (f) => f._id === loadedId
      );
      if (fav) {
        const currentQuery = mapFormFieldsToQuery(state.queryBar.fields);
        payload = {
          name: fav._name,
          isDirty: !isQueryEqual(
            getQueryAttributes(fav),
            getQueryAttributes(currentQuery)
          ),
        };
      }
      // If `loadedId` is set but `fav` isn't in `favoriteQueries`
      // yet — this happens during the brief window between
      // `saveDraftAsFavorite` dispatching `LoadedFavoriteSet` and
      // the follow-up `fetchFavorites` settling — keep the empty
      // payload. The next subscription tick (when FavoriteQueriesFetched
      // lands) will recompute with the real favorite.
    }
    if (
      lastBroadcast !== null &&
      payload.name === lastBroadcast.name &&
      payload.isDirty === lastBroadcast.isDirty
    ) {
      return;
    }
    lastBroadcast = payload;
    // Stash for late subscribers (the collection-header may mount
    // after the first emission; reading the sticky value on mount
    // means it doesn't have to wait for the next state change).
    (localAppRegistry as unknown as Record<string, unknown>)[
      LOADED_FAVORITE_STICKY_KEY
    ] = payload;
    localAppRegistry.emit(LOADED_FAVORITE_EVENT, payload);
  };
  const unsubscribeBroadcast = store.subscribe(broadcastLoadedFavorite);
  // Initial emission so the consumer-side sticky value is populated
  // before any listeners attach.
  broadcastLoadedFavorite();

  // Stash a dispatch-bound rename callback alongside the sticky
  // payload. Consumers outside this package (e.g. the breadcrumb chip
  // in compass-collection) can drive the rename through this without
  // having to import the thunk directly. Closes over the store's
  // dispatch so callers don't have to.
  const renameCallback: RenameLoadedFavorite = (newName) =>
    store.dispatch(renameLoadedFavorite(newName));
  (localAppRegistry as unknown as Record<string, unknown>)[
    LOADED_FAVORITE_RENAME_KEY
  ] = renameCallback;

  addCleanup(() => {
    unsubscribeBroadcast();
    // Clear the sticky value + callback so stale references don't leak
    // across collection-tab tear-downs (e.g. switching to a different
    // ns). Without this, a stale rename closure would still resolve
    // against this (now-dead) store after navigation.
    delete (localAppRegistry as unknown as Record<string, unknown>)[
      LOADED_FAVORITE_STICKY_KEY
    ];
    delete (localAppRegistry as unknown as Record<string, unknown>)[
      LOADED_FAVORITE_RENAME_KEY
    ];
  });

  return { store, deactivate: cleanup, context: QueryBarStoreContext };
}
