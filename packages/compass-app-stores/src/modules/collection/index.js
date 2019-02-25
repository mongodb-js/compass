import { combineReducers } from 'redux';
import collection, {
  INITIAL_STATE as COLLECTION_INITIAL_STATE
} from 'modules/collection/collection';
import activeTabIndex, {
  INITIAL_STATE as ACTIVE_TAB_INDEX_INITIAL_STATE
} from 'modules/collection/active-tab-index';
import tabs, {
  INITIAL_STATE as TABS_INITIAL_STATE
} from 'modules/collection/tabs';

import { RESET } from 'modules/collection/reset';
/**
 * The main reducer.
 */
const reducer = combineReducers({
  collection,
  activeTabIndex,
  tabs
});

/**
 * The root reducer.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const rootReducer = (state, action) => {
  if (action.type === RESET) {
    return {
      ...state,
      collection: COLLECTION_INITIAL_STATE,
      activeTabIndex: ACTIVE_TAB_INDEX_INITIAL_STATE,
      tabs: TABS_INITIAL_STATE
    };
  }
  return reducer(state, action);
};

export default rootReducer;
