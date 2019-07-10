import { combineReducers } from 'redux';

import appRegistry from 'mongodb-redux-common/app-registry';
import detailsPlugins from 'modules/details-plugins';
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
import isDetailsExpanded, {
  INITIAL_STATE as IS_DETAILS_EXPANDED_INITIAL_STATE
} from 'modules/is-details-expanded';
import isWritable, {
  INITIAL_STATE as IS_WRITABLE_INITIAL_STATE
} from 'modules/is-writable';
import isDataLake, {
  INITIAL_STATE as DL_INITIAL_STATE
} from './is-data-lake';
import { RESET } from 'modules/reset';

/**
 * The reducer.
 */
const reducer = combineReducers({
  appRegistry,
  databases,
  description,
  detailsPlugins,
  instance,
  filterRegex,
  isCollapsed,
  isDetailsExpanded,
  isWritable,
  isDataLake
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
      databases: DATABASES_INITIAL_STATE,
      description: DESCRIPTION_INITIAL_STATE,
      instance: INSTANCE_INITIAL_STATE,
      filterRegex: FILTER_REGEX_INITIAL_STATE,
      isCollapsed: IS_COLLAPSED_INITIAL_STATE,
      isDetailsExpanded: IS_DETAILS_EXPANDED_INITIAL_STATE,
      isWritable: IS_WRITABLE_INITIAL_STATE,
      isDataLake: DL_INITIAL_STATE
    };
  }
  return reducer(state, action);
};

export default rootReducer;
