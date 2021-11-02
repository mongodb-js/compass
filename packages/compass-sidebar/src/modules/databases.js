import toNS from 'mongodb-ns';

/**
 * Databases actions.
 */
export const CHANGE_DATABASES = 'sidebar/databases/CHANGE_DATABASES';
export const CHANGE_ACTIVE_NAMESPACE = 'sidebar/databases/CHANGE_ACTIVE_NAMESPACE';
const BLANK = '(?:)';

export const NO_ACTIVE_NAMESPACE = '';

/**
 * The initial state of the sidebar databases.
 */
export const INITIAL_STATE = {
  databases: [],
  expandedDblist: {},
  activeNamespace: NO_ACTIVE_NAMESPACE
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
  if (action.type === CHANGE_DATABASES) {
    return {
      databases: action.databases,
      expandedDblist: action.expandedDblist,
      activeNamespace: action.activeNamespace
    };
  }
  if (action.type === CHANGE_ACTIVE_NAMESPACE) {
    return {
      ...state,
      activeNamespace: action.activeNamespace
    };
  }
  return state;
}

/**
 * The change databases action creator.
 *
 * @param {Array} databases
 * @param {Object} expandedDblist
 * @param {String} activeNamespace
 *
 * @returns {Object} The action.
 */
export const changeDatabases = (databases, expandedDblist, activeNamespace) => ({
  type: CHANGE_DATABASES,
  databases: databases,
  expandedDblist: expandedDblist,
  activeNamespace: activeNamespace
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
  activeNamespace
});

export const filterDatabases = (filter, dbs, ns) => {
  return (dispatch, getState) => {
    const state = getState();
    const re = filter === null ? state.filterRegex : filter;
    const databases = dbs === null ? state.instance?.databases : dbs;
    const activeNamespace = ns === null ? state.databases.activeNamespace : ns;
    const activeDatabase = toNS(activeNamespace).database;

    let dbResult = [];

    if (databases && databases.length > 0) {
      dbResult = databases.reduce((result, db) => {
        const id = db._id;
        if (re.test(id)) {
          result.push(db);
        } else {
          const collections = db.collections
            .filter((coll) => re.test(coll.name));

          if (collections.length > 0) {
            result.push({
              ...db,
              collections,
            });
          }
        }
        return result;
      }, []);
    }

    const expandedDbList = Object.fromEntries(dbResult.map(({ _id }) => {
      return [_id, re.source !== BLANK || _id === activeDatabase];
    }));

    dispatch(changeDatabases(dbResult, expandedDbList, activeNamespace));
  };
};
