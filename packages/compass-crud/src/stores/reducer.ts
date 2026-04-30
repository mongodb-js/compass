import type { AnyAction } from 'redux';
import { combineReducers } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import type AppRegistry from '@mongodb-js/compass-app-registry';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import type { PreferencesAccess } from 'compass-preferences-model/provider';
import type {
  ConnectionInfoRef,
  ConnectionScopedAppRegistry,
} from '@mongodb-js/compass-connections/provider';
import type { FieldStoreService } from '@mongodb-js/compass-field-store';
import type { QueryBarService } from '@mongodb-js/compass-query-bar';
import type {
  FavoriteQueryStorage,
  RecentQueryStorage,
} from '@mongodb-js/my-queries-storage/provider';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';
import type { DataService } from '../utils/data-service';

import type {
  DocumentsActions,
  DocumentsState,
  DocumentsActionTypes,
} from './documents';
import { createDocumentsReducer } from './documents';
import type {
  CollectionMetaActions,
  CollectionMetaState,
  CollectionMetaActionTypes,
} from './collection-meta';
import { createCollectionMetaReducer } from './collection-meta';
import type { ViewActions, ViewActionTypes } from './view';
import { viewReducer } from './view';
import type { InsertActions, InsertActionTypes } from './insert';
import { insertReducer } from './insert';
import type { BulkUpdateActions, BulkUpdateActionTypes } from './bulk-update';
import { bulkUpdateReducer } from './bulk-update';
import type { BulkDeleteActions, BulkDeleteActionTypes } from './bulk-delete';
import { bulkDeleteReducer } from './bulk-delete';

export type EmittedAppRegistryEvents =
  | 'open-import'
  | 'open-export'
  | 'document-deleted'
  | 'documents-deleted'
  | 'document-inserted';

export type CrudStoreOptions = Pick<
  CollectionTabPluginMetadata,
  | 'query'
  | 'isReadonly'
  | 'namespace'
  | 'isTimeSeries'
  | 'isSearchIndexesSupported'
  | 'sourceName'
> & {
  noRefreshOnConfigure?: boolean;
};

export type CrudExtraArgs = {
  dataService: DataService;
  localAppRegistry: Pick<AppRegistry, 'on' | 'emit' | 'removeListener'>;
  globalAppRegistry: Pick<AppRegistry, 'on' | 'emit' | 'removeListener'>;
  preferences: PreferencesAccess;
  logger: Logger;
  track: TrackFunction;
  favoriteQueriesStorage?: FavoriteQueryStorage;
  recentQueriesStorage?: RecentQueryStorage;
  fieldStoreService: FieldStoreService;
  connectionInfoRef: ConnectionInfoRef;
  connectionScopedAppRegistry: ConnectionScopedAppRegistry<EmittedAppRegistryEvents>;
  queryBar: QueryBarService;
  crudOptions: CrudStoreOptions;
};

export type CrudReduxActions =
  | DocumentsActions
  | CollectionMetaActions
  | ViewActions
  | InsertActions
  | BulkUpdateActions
  | BulkDeleteActions;

type _ActionTypes = typeof DocumentsActionTypes &
  typeof CollectionMetaActionTypes &
  typeof ViewActionTypes &
  typeof InsertActionTypes &
  typeof BulkUpdateActionTypes &
  typeof BulkDeleteActionTypes;

export type CrudActionTypes = _ActionTypes[keyof _ActionTypes];

export function createRootReducer(initial: {
  documents: DocumentsState;
  collectionMeta: CollectionMetaState;
}) {
  return combineReducers({
    documents: createDocumentsReducer(initial.documents),
    collectionMeta: createCollectionMetaReducer(initial.collectionMeta),
    view: viewReducer,
    insert: insertReducer,
    bulkUpdate: bulkUpdateReducer,
    bulkDelete: bulkDeleteReducer,
  });
}

export type CrudState = ReturnType<ReturnType<typeof createRootReducer>>;

export type CrudThunkAction<R, A extends AnyAction> = ThunkAction<
  R,
  CrudState,
  CrudExtraArgs,
  A
>;
