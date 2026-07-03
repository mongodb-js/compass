import type { Store } from 'redux';
import { applyMiddleware, createStore } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';
import thunk from 'redux-thunk';
import { toJSString } from 'mongodb-query-parser';
import type AppRegistry from '@mongodb-js/compass-app-registry';
import type { ActivateHelpers } from '@mongodb-js/compass-app-registry';
import type {
  Collection,
  MongoDBInstance,
} from '@mongodb-js/compass-app-stores/provider';
import type { PreferencesAccess } from 'compass-preferences-model/provider';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import type { FieldStoreService } from '@mongodb-js/compass-field-store';
import type {
  ConnectionInfoRef,
  ConnectionScopedAppRegistry,
} from '@mongodb-js/compass-connections/provider';
import type { QueryBarService } from '@mongodb-js/compass-query-bar';
import type {
  FavoriteQueryStorageAccess,
  RecentQueryStorageAccess,
} from '@mongodb-js/my-queries-storage/provider';

import type { DataService } from '../utils/data-service';
import type { GridStore } from './grid-store';
import configureGridStore from './grid-store';
import configureActions from '../actions';
import {
  getInitialDocumentsState,
  refreshDocuments,
  cancelOperation,
} from './documents';
import { extractCollectionStats } from './collection-meta';
import {
  isWritableChanged,
  instanceDescriptionChanged,
  collectionStatsFetched,
} from './collection-meta';
import { openBulkUpdateModal, INITIAL_BULK_UPDATE_TEXT } from './bulk-update';
import {
  createRootReducer,
  type CrudExtraArgs,
  type CrudReduxActions,
  type CrudState,
  type CrudStoreOptions,
  type EmittedAppRegistryEvents,
} from './reducer';

export type {
  CrudStoreOptions,
  CrudState,
  CrudReduxActions,
  CrudActionTypes,
  CrudThunkAction,
  EmittedAppRegistryEvents,
} from './reducer';

export type {
  BSONObject,
  BSONArray,
  InsertCSFLEState,
  WriteError,
} from './insert';
export type { TableState, DocumentView } from './view';
export type { BulkDeleteState } from './bulk-delete';

export {
  fetchDocuments,
  findAndModifyWithFLEFallback,
} from '../utils/fetch-documents';
export { parseShellBSON } from '../utils/parse-shell-bson';
export {
  MAX_DOCS_PER_PAGE_STORAGE_KEY,
  COUNT_MAX_TIME_MS_CAP,
} from './documents';

export type DocumentsPluginServices = {
  dataService: DataService;
  instance: MongoDBInstance;
  localAppRegistry: Pick<AppRegistry, 'on' | 'emit' | 'removeListener'>;
  globalAppRegistry: Pick<AppRegistry, 'on' | 'emit' | 'removeListener'>;
  preferences: PreferencesAccess;
  logger: Logger;
  track: TrackFunction;
  favoriteQueryStorageAccess?: FavoriteQueryStorageAccess;
  recentQueryStorageAccess?: RecentQueryStorageAccess;
  fieldStoreService: FieldStoreService;
  connectionInfoRef: ConnectionInfoRef;
  connectionScopedAppRegistry: ConnectionScopedAppRegistry<EmittedAppRegistryEvents>;
  queryBar: QueryBarService;
  collection: Collection;
};

export type CrudDispatch = ThunkDispatch<
  CrudState,
  CrudExtraArgs,
  CrudReduxActions
>;

export type CrudReduxStore = Omit<
  Store<CrudState, CrudReduxActions>,
  'dispatch'
> & {
  dispatch: CrudDispatch;
  gridStore: GridStore;
};

export function activateDocumentsPlugin(
  options: CrudStoreOptions,
  {
    dataService,
    instance,
    localAppRegistry,
    globalAppRegistry,
    preferences,
    logger,
    track,
    favoriteQueryStorageAccess,
    recentQueryStorageAccess,
    fieldStoreService,
    connectionInfoRef,
    connectionScopedAppRegistry,
    queryBar,
    collection,
  }: DocumentsPluginServices,
  { on, cleanup }: ActivateHelpers
) {
  const initialDocumentsState = getInitialDocumentsState(options.namespace);
  const initialCollectionMetaState = {
    version: instance.build.version,
    isDataLake: !!instance.dataLake.isDataLake,
    isReadonly: !!options.isReadonly,
    isTimeSeries: !!options.isTimeSeries,
    isWritable: instance.isWritable,
    instanceDescription: instance.description,
    isSearchIndexesSupported: options.isSearchIndexesSupported,
    isUpdatePreviewSupported: instance.topologyDescription.type !== 'Single',
    collectionStats: extractCollectionStats(collection),
  };

  const reducer = createRootReducer({
    documents: initialDocumentsState,
    collectionMeta: initialCollectionMetaState,
  });

  const extraArgs: CrudExtraArgs = {
    dataService,
    localAppRegistry,
    globalAppRegistry,
    preferences,
    logger,
    track,
    favoriteQueriesStorage: favoriteQueryStorageAccess?.getStorage(),
    recentQueriesStorage: recentQueryStorageAccess?.getStorage(),
    fieldStoreService,
    connectionInfoRef,
    connectionScopedAppRegistry,
    queryBar,
    crudOptions: options,
  };

  const store = createStore(
    reducer,
    applyMiddleware(thunk.withExtraArgument(extraArgs))
  ) as unknown as CrudReduxStore;

  // The grid store is still Reflux-based, we attach it as a property
  // on the redux store so components can subscribe to it.
  const actions = configureActions();
  const gridStore = configureGridStore({ actions });
  store.gridStore = gridStore;

  on(
    localAppRegistry,
    'favorites-open-bulk-update-favorite',
    (query: { update: Record<string, unknown> }) => {
      void store.dispatch(refreshDocuments());
      void store.dispatch(
        openBulkUpdateModal(
          toJSString(query.update) || INITIAL_BULK_UPDATE_TEXT
        )
      );
    }
  );

  on(instance, 'change:isWritable', () => {
    store.dispatch(isWritableChanged(instance.isWritable));
  });

  on(instance, 'change:description', () => {
    store.dispatch(instanceDescriptionChanged(instance.description));
  });

  on(globalAppRegistry, 'refresh-data', () => {
    void store.dispatch(refreshDocuments());
  });

  on(
    globalAppRegistry,
    'import-finished',
    (
      { ns }: { ns: string },
      { connectionId }: { connectionId?: string } = {}
    ) => {
      const { id: currentConnectionId } = connectionInfoRef.current;
      const currentNs = store.getState().documents.ns;
      if (currentConnectionId === connectionId && ns === currentNs) {
        void store.dispatch(refreshDocuments());
      }
    }
  );

  on(collection, 'change:status', (model: Collection, status: string) => {
    if (status === 'ready') {
      store.dispatch(collectionStatsFetched(model));
    }
  });

  if (!options.noRefreshOnConfigure) {
    queueMicrotask(() => {
      void store.dispatch(refreshDocuments());
    });
  }

  if ((options.query as any)?.update) {
    // Set when the user clicked a bulk update query on the My Queries page.
    const initialUpdate = (options.query as any)?.update as
      | Record<string, unknown>
      | undefined;
    const updateText = initialUpdate ? toJSString(initialUpdate) : undefined;

    queueMicrotask(() => {
      void store.dispatch(openBulkUpdateModal(updateText));
    });
  }

  return {
    store,
    deactivate() {
      store.dispatch(cancelOperation());
      cleanup();
    },
  };
}
