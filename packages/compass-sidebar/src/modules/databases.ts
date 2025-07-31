import type { MongoDBInstance } from 'mongodb-instance-model';
import type { RootAction, SidebarThunkAction } from '.';
import { type ConnectionInfo } from '@mongodb-js/connection-info';

/**
 * Databases actions.
 */
export const CHANGE_DATABASES = 'sidebar/databases/CHANGE_DATABASES' as const;
interface ChangeDatabasesAction {
  type: typeof CHANGE_DATABASES;
  connectionId: ConnectionInfo['id'];
  databases: Database[];
}

export const TOGGLE_DATABASE = 'sidebar/databases/TOGGLE_DATABASE' as const;
interface ToggleDatabaseAction {
  type: typeof TOGGLE_DATABASE;
  connectionId: ConnectionInfo['id'];
  database: string;
  expanded: boolean;
}

export const FETCH_ALL_COLLECTIONS =
  'sidebar/instance/FETCH_ALL_COLLECTIONS' as const;
interface FetchAllCollectionsAction {
  type: typeof FETCH_ALL_COLLECTIONS;
}

export const EXPAND_DATABASE = 'sidebar/instance/EXPAND_DATABASE' as const;
interface ExpandDatabaseAction {
  type: typeof EXPAND_DATABASE;
  connectionId: ConnectionInfo['id'];
  databaseId: string;
}

export type DatabasesAction =
  | ChangeDatabasesAction
  | ToggleDatabaseAction
  | FetchAllCollectionsAction
  | ExpandDatabaseAction;

export type InstanceDatabase = MongoDBInstance['databases'][number];

export type Database = Pick<
  InstanceDatabase,
  '_id' | 'name' | 'collectionsStatus' | 'collectionsLength'
> & {
  inferredFromPrivileges: boolean;
  collections: Array<
    Pick<
      InstanceDatabase['collections'][number],
      '_id' | 'name' | 'type' | 'sourceName' | 'pipeline'
    > & {
      inferredFromPrivileges: boolean;
    }
  >;
};
export type AllDatabasesState = Record<
  ConnectionInfo['id'],
  ConnectionDatabasesState
>;
export interface ConnectionDatabasesState {
  databases: Database[];
  expandedDbList: Record<string, boolean>;
}

/**
 * The initial state of the sidebar databases.
 */
export const INITIAL_STATE: AllDatabasesState = {};

/**
 * Reducer function for handle state changes to sidebar databases.
 *
 * @param {String} state - The sidebar databases state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
export default function reducer(
  state: AllDatabasesState = INITIAL_STATE,
  action: RootAction
): AllDatabasesState {
  if (action.type === TOGGLE_DATABASE) {
    const { expandedDbList } = state[action.connectionId] || {};
    if (expandedDbList) {
      const previousExpandedState = expandedDbList[action.database];

      if (previousExpandedState === action.expanded) {
        return state;
      }
    }

    return {
      ...state,
      [action.connectionId]: {
        ...state[action.connectionId],
        expandedDbList: {
          ...expandedDbList,
          [action.database]: action.expanded,
        },
      },
    };
  } else if (action.type === CHANGE_DATABASES) {
    return {
      ...state,
      [action.connectionId]: {
        ...state[action.connectionId],
        databases: action.databases,
      },
    };
  }

  return state;
}

export const changeDatabases = (
  connectionId: ConnectionInfo['id'],
  databases: Database[]
) => ({
  type: CHANGE_DATABASES,
  connectionId,
  databases,
});

// Receives connectionId only to support filtering for single connections
// navigation tree
export const fetchAllCollections =
  (connectionId?: string): SidebarThunkAction<void, DatabasesAction> =>
  (dispatch, getState, { globalAppRegistry }) => {
    globalAppRegistry.emit('sidebar-filter-navigation-list', { connectionId });
    dispatch({ type: FETCH_ALL_COLLECTIONS });
  };

export const onDatabaseExpand =
  (
    connectionId: ConnectionInfo['id'],
    databaseId: string
  ): SidebarThunkAction<void, DatabasesAction> =>
  (dispatch, getState, { globalAppRegistry }) => {
    globalAppRegistry.emit('sidebar-expand-database', databaseId, {
      connectionId,
    });
    dispatch({ type: EXPAND_DATABASE, connectionId, databaseId });
  };
