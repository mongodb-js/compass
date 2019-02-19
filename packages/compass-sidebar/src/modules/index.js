import { combineReducers } from 'redux';

import activeNamespace, {
  INITIAL_STATE as ACTIVE_NAMESPACE_INITIAL_STATE
} from 'modules/active-namespace';
import databases, {
  INITIAL_STATE as DATABASES_INITIAL_STATE
} from 'modules/databases';
import description, {
  INITIAL_STATE as DESCRIPTION_INITIAL_STATE
} from 'modules/description';
import instance, {
  INITIAL_STATE as INSTANCE_INITIAL_STATE
} from 'modules/instance';
import filterRegex, {
  INITIAL_STATE as FILTER_REGEX_INITIAL_STATE
} from 'modules/filter-regex';
import isCollapsed, {
  INITIAL_STATE as IS_COLLAPSED_INITIAL_STATE
} from 'modules/is-collapsed';
import isDblistExpanded, {
  INITIAL_STATE as IS_DBLIST_EXPANDED_INITIAL_STATE
} from 'modules/is-dblist-expanded';
import isWritable, {
  INITIAL_STATE as IS_WRITABLE_INITIAL_STATE
} from 'modules/is-writable';
import { RESET } from 'modules/reset';
import expandedDbList, {
  INITIAL_STATE as EXPANDED_DBLIST_INITIAL_STATE
} from 'modules/expanded-dblist';

/**
 * The reducer.
 */
const reducer = combineReducers({
  activeNamespace,
  databases,
  description,
  instance,
  filterRegex,
  isCollapsed,
  isDblistExpanded,
  expandedDbList,
  isWritable
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
      activeNamespace: ACTIVE_NAMESPACE_INITIAL_STATE,
      databases: DATABASES_INITIAL_STATE,
      description: DESCRIPTION_INITIAL_STATE,
      instance: INSTANCE_INITIAL_STATE,
      filterRegex: FILTER_REGEX_INITIAL_STATE,
      isCollapsed: IS_COLLAPSED_INITIAL_STATE,
      isDblistExpanded: IS_DBLIST_EXPANDED_INITIAL_STATE,
      expandedDblist: EXPANDED_DBLIST_INITIAL_STATE,
      isWritable: IS_WRITABLE_INITIAL_STATE
    };
  }
  return reducer(state, action);
};

export default rootReducer;
