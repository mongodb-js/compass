import { LOADING_STATE } from 'constants/sidebar-constants';
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
    const databases = dbs === null ? state.instance.databases : dbs;

    let dbResult;

    // empty array vs Ampersand collection = technical debt
    if (databases === LOADING_STATE ||
      (Array.isArray(databases) && databases.length === 0) ||
      (!Array.isArray(databases) && databases.isEmpty())) {
      dbResult = [];
    } else {
      dbResult = databases.reduce((filteredDbs, db) => {
        if (re.test(db._id)) {
          filteredDbs.push(db.toJSON());
        } else {
          const collections = db.collections.models.filter(c => re.test(toNS(c._id).collection));
          if (collections.length) {
            filteredDbs.push({
              _id: db._id,
              collections
            });
          }
        }
        return filteredDbs;
      }, []);
    }

    const activeNamespace = ns === null ? state.databases.activeNamespace : ns;
    const expandedDblist = {};
    dbResult.map((db) => {
      expandedDblist[db._id] = (
        re.source !== BLANK || db._id === toNS(activeNamespace).database
      );
    });
    dispatch(changeDatabases(dbResult, expandedDblist, activeNamespace));
  };
};
