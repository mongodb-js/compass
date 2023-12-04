import type { MongoDBInstance } from 'mongodb-instance-model';
import type { RootAction, RootState } from '.';
import type { Dispatch } from 'redux';
import toNS from 'mongodb-ns';

/**
 * Databases actions.
 */
export const CHANGE_FILTER_REGEX =
  'sidebar/databases/CHANGE_FILTER_REGEX' as const;
interface ChangeFilterRegexAction {
  type: typeof CHANGE_FILTER_REGEX;
  filterRegex: null | RegExp;
}

export const CHANGE_DATABASES = 'sidebar/databases/CHANGE_DATABASES' as const;
interface ChangeDatabasesAction {
  type: typeof CHANGE_DATABASES;
  databases: Database[];
}

export const TOGGLE_DATABASE = 'sidebar/databases/TOGGLE_DATABASE' as const;
interface ToggleDatabaseAction {
  type: typeof TOGGLE_DATABASE;
  id: string;
  expanded: boolean;
}

export type DatabasesAction =
  | ChangeFilterRegexAction
  | ChangeDatabasesAction
  | ToggleDatabaseAction;

const NO_REGEX = null;

export const NO_ACTIVE_NAMESPACE = '';

type DatabaseRaw = MongoDBInstance['databases'][number];
export type Database = Pick<
  DatabaseRaw,
  '_id' | 'name' | 'collectionsStatus' | 'collectionsLength'
> & {
  collections: Pick<
    DatabaseRaw['collections'][number],
    '_id' | 'name' | 'type'
  >[];
};
export interface DatabaseState {
  databases: Database[];
  filteredDatabases: Database[];
  expandedDbList: Record<string, boolean>;
  filterRegex: null | RegExp;
}

/**
 * The initial state of the sidebar databases.
 */
export const INITIAL_STATE: DatabaseState = {
  databases: [],
  filteredDatabases: [],
  expandedDbList: Object.create(null),
  filterRegex: NO_REGEX,
};

/**
 * Reducer function for handle state changes to sidebar databases.
 *
 * @param {String} state - The sidebar databases state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
export default function reducer(
  state: DatabaseState = INITIAL_STATE,
  action: RootAction
): DatabaseState {
  if (action.type === TOGGLE_DATABASE) {
    return {
      ...state,
      expandedDbList: {
        ...state.expandedDbList,
        [action.id]: action.expanded,
      },
    };
  }

  if (action.type === CHANGE_FILTER_REGEX) {
    const filterModeStatusChange =
      Boolean(state.filterRegex && !action.filterRegex) ||
      Boolean(!state.filterRegex && action.filterRegex);

    let expandedDbList = state.expandedDbList;

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
      filterRegex: action.filterRegex,
      filteredDatabases: filterDatabases(state.databases, action.filterRegex),
      expandedDbList,
    };
  }

  if (action.type === CHANGE_DATABASES) {
    return {
      ...state,
      databases: action.databases,
      filteredDatabases: filterDatabases(action.databases, state.filterRegex),
    };
  }
  return state;
}

/**
 * The change databases action creator.
 *
 * @param {Array} databases
 *
 * @returns {Object} The action.
 */
export const changeDatabases = (databases: Database[]) => ({
  type: CHANGE_DATABASES,
  databases,
});

export const toggleDatabaseExpanded =
  (id: string, forceExpand: boolean) =>
  (dispatch: Dispatch<DatabasesAction>, getState: () => RootState) => {
    const { database } = toNS(id);
    const { appRegistry, databases } = getState();
    const expanded = forceExpand ?? !databases.expandedDbList[database];
    if (appRegistry.globalAppRegistry && expanded) {
      // Fetch collections list on expand if we haven't done it yet (this is
      // relevant only for the code path that has global overlay disabled)
      appRegistry.globalAppRegistry.emit('sidebar-expand-database', database);
    }
    dispatch({ type: TOGGLE_DATABASE, id: database, expanded });
  };

export const changeFilterRegex =
  (filterRegex: RegExp | null) =>
  (
    dispatch: Dispatch<DatabasesAction>,
    getState: () => Pick<RootState, 'appRegistry'>
  ) => {
    const { appRegistry } = getState();
    if (appRegistry.globalAppRegistry && filterRegex) {
      // When filtering, emit an event so that we can fetch all collections. This
      // is required as a workaround for the syncronous nature of the current
      // filtering feature
      appRegistry.globalAppRegistry.emit('sidebar-filter-navigation-list');
    }
    dispatch({
      type: CHANGE_FILTER_REGEX,
      filterRegex: filterRegex,
    });
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
