import toNS from 'mongodb-ns';

/**
 * Databases actions.
 */
export const CHANGE_FILTER_REGEX = 'sidebar/databases/CHANGE_FILTER_REGEX';
export const CHANGE_DATABASES = 'sidebar/databases/CHANGE_DATABASES';
export const CHANGE_ACTIVE_NAMESPACE =
  'sidebar/databases/CHANGE_ACTIVE_NAMESPACE';
export const TOGGLE_DATABASE = 'sidebar/databases/TOGGLE_DATABASE';

const NO_REGEX = null;

export const NO_ACTIVE_NAMESPACE = '';

/**
 * The initial state of the sidebar databases.
 */
export const INITIAL_STATE = {
  databases: [],
  filteredDatabases: [],
  expandedDbList: {},
  activeNamespace: NO_ACTIVE_NAMESPACE,
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
export default function reducer(state = INITIAL_STATE, action) {
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

  if (action.type === CHANGE_ACTIVE_NAMESPACE) {
    return {
      ...state,
      activeNamespace: action.activeNamespace,
      ...(action.activeDatabase && {
        expandedDbList: {
          ...state.expandedDbList,
          [action.activeDatabase]: true,
        },
      }),
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
export const changeDatabases = (databases) => ({
  type: CHANGE_DATABASES,
  databases,
});

/**
 * The change active namespace action creator.
 *
 * @param {String} activeNamespace
 *
 * @returns {Object} The action.
 */
export const changeActiveNamespace = (activeNamespace) => ({
  type: CHANGE_ACTIVE_NAMESPACE,
  activeNamespace,
  activeDatabase: toNS(activeNamespace).database,
});

export const toggleDatabaseExpanded = (id, force) => (dispatch, getState) => {
  const { appRegistry, databases } = getState();
  const expanded = force ?? !databases.expandedDbList[id];
  if (appRegistry.globalAppRegistry && expanded) {
    // Fetch collections list on expand if we haven't done it yet (this is
    // relevant only for the code path that has global overlay disabled)
    appRegistry.globalAppRegistry.emit('sidebar-expand-database', id);
  }
  dispatch({ type: TOGGLE_DATABASE, id, expanded });
};

/**
 * The change filterRegex action creator.
 *
 * @param {String} filterRegex - The filterRegex.
 *
 * @returns {Object} The action.
 */
export const changeFilterRegex = (filterRegex) => (dispatch, getState) => {
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

const filterDatabases = (databases, re) => {
  if (!re) {
    return databases;
  }

  return databases.reduce((result, db) => {
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
    return result;
  }, []);
};
