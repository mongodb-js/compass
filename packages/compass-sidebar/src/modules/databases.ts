import type { MongoDBInstance } from 'mongodb-instance-model';
import type { RootAction, SidebarThunkAction } from '.';
import toNS from 'mongodb-ns';
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

export type DatabasesAction = ChangeDatabasesAction | ToggleDatabaseAction;

type DatabaseRaw = MongoDBInstance['databases'][number];

export type Database = Pick<
  DatabaseRaw,
  '_id' | 'name' | 'collectionsStatus' | 'collectionsLength'
> & {
  collections: Pick<
    DatabaseRaw['collections'][number],
    '_id' | 'name' | 'type' | 'sourceName' | 'pipeline'
  >[];
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

export const toggleDatabaseExpanded =
  (
    connectionId: ConnectionInfo['id'],
    databaseId: string,
    forceExpand: boolean
  ): SidebarThunkAction<void, DatabasesAction> =>
  (dispatch, getState, { globalAppRegistry }) => {
    const { database } = toNS(databaseId);
    const { expandedDbList } = getState().databases[connectionId];
    const expanded = forceExpand ?? !expandedDbList[database];

    if (expanded) {
      // Fetch collections list on expand if we haven't done it yet (this is
      // relevant only for the code path that has global overlay disabled)
      globalAppRegistry.emit('sidebar-expand-database', database);
    }
    dispatch({ type: TOGGLE_DATABASE, connectionId, database, expanded });
  };

export const filterDatabases = (databases: Database[], re: RegExp | null) => {
  if (!re) {
    return databases;
  }

  const result: Database[] = [];
  for (const db of databases) {
    const id = db._id;
    if (re.test(id)) {
      result.push(db);
    } else {
      const collections = db.collections.filter((coll) => re.test(coll.name));

      if (collections.length > 0) {
        result.push({
          ...db,
          collections,
        });
      }
    }
  }

  return result;
};
