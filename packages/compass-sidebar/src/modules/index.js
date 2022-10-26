import { combineReducers } from 'redux';

import appRegistry from '@mongodb-js/mongodb-redux-common/app-registry';
import databases, {
  INITIAL_STATE as DATABASES_INITIAL_STATE,
} from './databases';
import instance, { INITIAL_STATE as INSTANCE_INITIAL_STATE } from './instance';
import isDetailsExpanded, {
  INITIAL_STATE as IS_DETAILS_EXPANDED_INITIAL_STATE,
} from './is-details-expanded';
import { RESET } from './reset';
import isGenuineMongoDBVisible, {
  INITIAL_STATE as IS_VISIBLE_IS,
} from './is-genuine-mongodb-visible';
import connectionInfo, {
  INITIAL_STATE as CONNECTION_INFO_IS,
} from './connection-info';
import connectionOptions, {
  INITIAL_STATE as CONNECTION_OPTIONS_IS,
} from './connection-options';
import location, { INITIAL_STATE as LOCATION_IS } from './location';
import isExpanded, { INITIAL_STATE as IS_EXPANDED_IS } from './is-expanded';
import preferencesReadOnly, {
  INITIAL_STATE as PREFERENCES_READONLY_INITIAL_STATE,
} from './preferences-readonly';

/**
 * The reducer.
 */
const reducer = combineReducers({
  appRegistry,
  databases,
  connectionInfo,
  connectionOptions,
  instance,
  isDetailsExpanded,
  isGenuineMongoDBVisible,
  location,
  isExpanded,
  preferencesReadOnly,
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
      connectionInfo: CONNECTION_INFO_IS,
      connectionOptions: CONNECTION_OPTIONS_IS,
      databases: DATABASES_INITIAL_STATE,
      instance: INSTANCE_INITIAL_STATE,
      isDetailsExpanded: IS_DETAILS_EXPANDED_INITIAL_STATE,
      isGenuineMongoDBVisible: IS_VISIBLE_IS,
      location: LOCATION_IS,
      isExpanded: IS_EXPANDED_IS,
      preferencesReadOnly: PREFERENCES_READONLY_INITIAL_STATE,
    };
  }
  return reducer(state, action);
};

export default rootReducer;
