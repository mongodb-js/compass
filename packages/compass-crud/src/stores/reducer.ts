import type { AnyAction } from 'redux';
import { combineReducers } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import type { CrudStoreServices } from './store';
import type { CrudStoreOptions } from './crud-types';
import type {
  FavoriteQueryStorage,
  RecentQueryStorage,
} from '@mongodb-js/my-queries-storage/provider';
import { crudReducer, getInitialCrudState } from './crud';
import type { CrudActions } from './crud';
import { insertReducer } from './insert';
import type { InsertActions } from './insert';
import { bulkUpdateReducer } from './bulk-update';
import type { BulkUpdateActions } from './bulk-update';
import { bulkDeleteReducer } from './bulk-delete';
import type { BulkDeleteActions } from './bulk-delete';
import { tableReducer } from './table';
import type { TableActions } from './table';
const reducer = combineReducers({
  crud: crudReducer,
  insert: insertReducer,
  bulkUpdate: bulkUpdateReducer,
  bulkDelete: bulkDeleteReducer,
  table: tableReducer,
});

export type RootCrudState = ReturnType<typeof reducer>;

export type CrudStoreActions =
  | CrudActions
  | InsertActions
  | BulkUpdateActions
  | BulkDeleteActions
  | TableActions;

export type CrudExtraArgs = CrudStoreServices &
  CrudStoreOptions & {
    favoriteQueriesStorage?: FavoriteQueryStorage;
    recentQueriesStorage?: RecentQueryStorage;
    abortControllerRef: { current: AbortController | null };
    bulkUpdateAbortControllerRef: { current: AbortController | null };
  };

export type CrudThunkAction<R, A extends AnyAction = AnyAction> = ThunkAction<
  R,
  RootCrudState,
  CrudExtraArgs,
  A
>;

export { getInitialCrudState };

export default reducer;
