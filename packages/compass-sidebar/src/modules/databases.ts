import type { MongoDBInstance } from 'mongodb-instance-model';
import type { RootAction, SidebarThunkAction } from '.';
import toNS from 'mongodb-ns';
import { type ConnectionInfo } from '@mongodb-js/connection-info';

/**
 * Databases actions.
 */
export const CHANGE_FILTER_REGEX =
  'sidebar/databases/CHANGE_FILTER_REGEX' as const;

interface ChangeFilterRegexAction {
  type: typeof CHANGE_FILTER_REGEX;
  connectionId: ConnectionInfo['id'];
  filterRegex: null | RegExp;
}

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

export type DatabasesAction =
  | ChangeFilterRegexAction
  | ChangeDatabasesAction
  | ToggleDatabaseAction;

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
  filteredDatabases: Database[];
  expandedDbList: Record<string, boolean>;
  filterRegex: null | RegExp;
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
    if (
      state[action.connectionId] &&
      state[action.connectionId].expandedDbList
    ) {
      const previousExpandedState =
        state[action.connectionId]?.expandedDbList[action.database];

      if (previousExpandedState === action.expanded) {
        return state;
      }
    }

    return {
      ...state,
      [action.connectionId]: {
        ...state[action.connectionId],
        expandedDbList: {
          ...state[action.connectionId].expandedDbList,
          [action.database]: action.expanded,
        },
      },
    };
  } else if (action.type === CHANGE_FILTER_REGEX) {
    const filterModeStatusChange =
      Boolean(state[action.connectionId]?.filterRegex && !action.filterRegex) ||
      Boolean(!state[action.connectionId]?.filterRegex && action.filterRegex);

    let expandedDbList = state[action.connectionId]?.expandedDbList ?? {};

    // On filter mode status change (when either entering "filter mode" when no
    // regex was in the search box before or exiting it) we want to filter out
    // all the "collapsed" states so that default collapsed state that is based
    // on the "filter mode" can take over. When user then collapses something in
    // the navigation we want to preserve their choice until the "filter mode"
    // is changed again
    if (filterModeStatusChange) {
      expandedDbList = Object.fromEntries(
        Object.entries(expandedDbList).filter(([, val]) => val !== false)
      );
    }

    return {
      ...state,
      [action.connectionId]: {
        ...state[action.connectionId],
        filterRegex: action.filterRegex,
        filteredDatabases: filterDatabases(
          state[action.connectionId]?.databases ?? [],
          action.filterRegex
        ),
        expandedDbList,
      },
    };
  } else if (action.type === CHANGE_DATABASES) {
    return {
      ...state,
      [action.connectionId]: {
        ...state[action.connectionId],
        databases: action.databases,
        filteredDatabases: filterDatabases(
          action.databases,
          state[action.connectionId]?.filterRegex
        ),
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

export const changeFilterRegex =
  (filterRegex: RegExp | null): SidebarThunkAction<void, DatabasesAction> =>
  (dispatch, getState, { globalAppRegistry }) => {
    if (filterRegex) {
      // When filtering, emit an event so that we can fetch all collections. This
      // is required as a workaround for the syncronous nature of the current
      // filtering feature
      globalAppRegistry.emit('sidebar-filter-navigation-list');
    }

    for (const connectionId of Object.keys(getState().databases)) {
      dispatch({
        type: CHANGE_FILTER_REGEX,
        connectionId,
        filterRegex,
      });
    }
  };

const filterDatabases = (databases: Database[], re: RegExp | null) => {
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
