import toNS from 'mongodb-ns';
/**
 * Expanded dblist action.
 */
export const CHANGE_EXPANDED_DBLIST = 'sidebar/expanded-dblist/CHANGE_EXPANDED_DBLIST';

/**
 * The initial state of the sidebar expanded dblist.
 */
export const INITIAL_STATE = {};

/**
 * Reducer function for handle state changes to sidebar expanded dblist.
 *
 * @param {String} state - The sidebar expanded dblist state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_EXPANDED_DBLIST) {
    return action.expandedDblist;
  }
  return state;
}

/**
 * The change expandedDblist action creator.
 *
 * @param {String} expandedDblist - The expandedDblist.
 *
 * @returns {Object} The action.
 */
export const changeExpandedDblist = (expandedDblist) => ({
  type: CHANGE_EXPANDED_DBLIST,
  expandedDblist: expandedDblist
});

export const updateExpandedDblist = (dbs, ns) => {
  return (dispatch, getState) => {
    const state = getState();
    const databases = dbs === null ? state.databases : dbs;
    const activeNamespace = ns === null ? state.activeNamespace : ns;

    const expandedDB = {};
    databases.map((db) => {
      if (state.isDblistExpanded === true || db._id === toNS(activeNamespace).database) {
        expandedDB[db._id] = true;
      } else {
        expandedDB[db._id] = false;
      }
    });
    console.log('expandedDb');
    console.log(expandedDB);
    dispatch(changeExpandedDblist(expandedDB));
  };
};
