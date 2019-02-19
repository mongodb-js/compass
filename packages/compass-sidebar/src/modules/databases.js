import { LOADING_STATE } from 'constants/sidebar-constants';
import toNS from 'mongodb-ns';

/**
 * Databases action.
 */
export const CHANGE_DATABASES = 'sidebar/databases/CHANGE_DATABASES';

/**
 * The initial state of the sidebar databases.
 */
export const INITIAL_STATE = {
  databases: [],
  expandedDblist: {},
  activeNamespace: ''
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
    return { ...state, databases: action.databases, expandedDblist: action.expandedDblist }
  }
  return state;
}

/**
 * The change databases action creator.
 *
 * @param {String} databases - The databases.
 *
 * @param expandedDblist
 * @returns {Object} The action.
 */
export const changeDatabases = (databases, expandedDblist, activeNamespace) => ({
  type: CHANGE_DATABASES,
  databases: databases,
  expandedDblist: expandedDblist,
  activeNamespace: activeNamespace
});

export const filterDatabases = (filter, dbs, ns) => {
  return (dispatch, getState) => {
    const state = getState();
    const re = filter === null ? state.filterRegex : filter;
    const databases = dbs === null ? state.databases : dbs;
    const activeNamespace = ns === null ? state.activeNamespace : ns;

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
          const collections = db.collections.models.filter(c => re.test(c._id));
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

    const expandedDblist = {};
    dbResult.map((db) => {
      if (state.isDblistExpanded === true || db._id === toNS(activeNamespace).database) {
        expandedDblist[db._id] = true;
      } else {
        expandedDblist[db._id] = false;
      }
    });
    dispatch(changeDatabases(dbResult, expandedDblist, activeNamespace));
  };
};
