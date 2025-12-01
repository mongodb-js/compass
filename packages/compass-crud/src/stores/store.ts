import type { PreferencesAccess } from 'compass-preferences-model/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry/provider';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import type { ActivateHelpers } from '@mongodb-js/compass-app-registry';
import { applyMiddleware, createStore } from 'redux';
import reducer, { getInitialCrudState } from './reducer';
import type { CrudExtraArgs } from './reducer';
import thunk from 'redux-thunk';
import type {
  FavoriteQueryStorageAccess,
  RecentQueryStorageAccess,
} from '@mongodb-js/my-queries-storage/provider';
import type { DataService } from '../utils/data-service';
import type {
  Collection,
  MongoDBInstance,
} from '@mongodb-js/compass-app-stores/provider';
import type AppRegistry from '@mongodb-js/compass-app-registry';
import type { FieldStoreService } from '@mongodb-js/compass-field-store';
import type {
  ConnectionInfoRef,
  ConnectionScopedAppRegistry,
} from '@mongodb-js/compass-connections/provider';
import type { QueryBarService } from '@mongodb-js/compass-query-bar';
import type { EmittedAppRegistryEvents } from './crud-types';
import type { CrudStoreOptions } from './crud-types';
import { refreshDocuments } from './crud';
import { openBulkUpdateModal } from './bulk-update';
import { toJSString } from 'mongodb-query-parser';
import type { BSONObject } from './crud-types';

export type CrudStoreServices = {
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

function extractCollectionStats(collection: Collection) {
  const coll = collection.toJSON();
  return {
    document_count: coll.document_count ?? 0,
    storage_size: coll.storage_size ?? 0,
    free_storage_size: coll.free_storage_size ?? 0,
    avg_document_size: coll.avg_document_size ?? 0,
  };
}

export function activateCrudStore(
  options: CrudStoreOptions,
  services: CrudStoreServices,
  { on, cleanup, addCleanup }: ActivateHelpers
) {
  const abortControllerRef: CrudExtraArgs['abortControllerRef'] = {
    current: null,
  };

  const bulkUpdateAbortControllerRef: CrudExtraArgs['bulkUpdateAbortControllerRef'] =
    {
      current: null,
    };

  // Initialize the crud state
  const initialCrudState = getInitialCrudState(
    options.namespace,
    !!options.isReadonly,
    !!options.isTimeSeries,
    options.isSearchIndexesSupported,
    services.instance.build.version,
    !!services.instance.dataLake.isDataLake,
    services.instance.isWritable,
    services.instance.description,
    services.instance.topologyDescription.type !== 'Single',
    extractCollectionStats(services.collection)
  );

  const store = createStore(
    reducer,
    {
      crud: initialCrudState,
      insert: undefined,
      bulkUpdate: undefined,
      bulkDelete: undefined,
      table: undefined,
    } as any,
    applyMiddleware(
      thunk.withExtraArgument<CrudExtraArgs>({
        ...services,
        ...options,
        favoriteQueriesStorage:
          services.favoriteQueryStorageAccess?.getStorage(),
        recentQueriesStorage: services.recentQueryStorageAccess?.getStorage(),
        abortControllerRef,
        bulkUpdateAbortControllerRef,
      })
    )
  );

  const {
    localAppRegistry,
    globalAppRegistry,
    instance,
    collection,
    connectionInfoRef,
  } = services;

  addCleanup(() => {
    abortControllerRef.current?.abort();
    bulkUpdateAbortControllerRef.current?.abort();
  });

  on(
    localAppRegistry,
    'favorites-open-bulk-update-favorite',
    (query: { update: BSONObject }) => {
      void store.dispatch(refreshDocuments());
      const INITIAL_BULK_UPDATE_TEXT = `{
  $set: {

  },
}`;
      void store.dispatch(
        openBulkUpdateModal(
          toJSString(query.update) || INITIAL_BULK_UPDATE_TEXT
        )
      );
    }
  );

  on(instance, 'change:isWritable', () => {
    store.dispatch({
      type: 'compass-crud/UPDATE_INSTANCE_WRITABLE',
      payload: instance.isWritable,
    });
  });

  on(instance, 'change:description', () => {
    store.dispatch({
      type: 'compass-crud/UPDATE_INSTANCE_DESCRIPTION',
      payload: instance.description,
    });
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
      const currentNs = store.getState().crud?.ns;
      if (currentConnectionId === connectionId && ns === currentNs) {
        void store.dispatch(refreshDocuments());
      }
    }
  );

  on(collection, 'change:status', (model: Collection, status: string) => {
    if (status === 'ready') {
      store.dispatch({
        type: 'compass-crud/COLLECTION_STATS_FETCHED',
        payload: {
          document_count: model.toJSON().document_count,
          storage_size: model.toJSON().storage_size,
          free_storage_size: model.toJSON().free_storage_size,
          avg_document_size: model.toJSON().avg_document_size,
        },
      });
    }
  });

  if (!options.noRefreshOnConfigure) {
    queueMicrotask(() => {
      void store.dispatch(refreshDocuments());
    });
  }

  if ((options.query as any)?.update) {
    const initialUpdate: BSONObject | undefined = (options.query as any)
      ?.update;
    const updateText = initialUpdate ? toJSString(initialUpdate) : undefined;

    queueMicrotask(() => {
      void store.dispatch(openBulkUpdateModal(updateText));
    });
  }

  return {
    store,
    deactivate: cleanup,
  };
}
