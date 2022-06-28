import { combineReducers } from 'redux';

import appRegistry from '@mongodb-js/mongodb-redux-common/app-registry';
import detailsPlugins from './details-plugins';
import databases, {
  INITIAL_STATE as DATABASES_INITIAL_STATE,
} from './databases';
import description, {
  INITIAL_STATE as DESCRIPTION_INITIAL_STATE,
} from './description';
import instance, { INITIAL_STATE as INSTANCE_INITIAL_STATE } from './instance';
import isDetailsExpanded, {
  INITIAL_STATE as IS_DETAILS_EXPANDED_INITIAL_STATE,
} from './is-details-expanded';
import isWritable, {
  INITIAL_STATE as IS_WRITABLE_INITIAL_STATE,
} from './is-writable';
import isDataLake, { INITIAL_STATE as DL_INITIAL_STATE } from './is-data-lake';
import { RESET } from './reset';
import isGenuineMongoDB, {
  INITIAL_STATE as GENUINE_IS,
} from './is-genuine-mongodb';
import isGenuineMongoDBVisible, {
  INITIAL_STATE as IS_VISIBLE_IS,
} from './is-genuine-mongodb-visible';
import connectionInfo, {
  INITIAL_STATE as CONNECTION_INFO_IS,
} from './connection-info';

/**
 * The reducer.
 */
const reducer = combineReducers({
  appRegistry,
  databases,
  connectionInfo,
  description,
  detailsPlugins,
  instance,
  isDetailsExpanded,
  isWritable,
  isGenuineMongoDB,
  isGenuineMongoDBVisible,
  isDataLake,
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
      databases: DATABASES_INITIAL_STATE,
      description: DESCRIPTION_INITIAL_STATE,
      instance: INSTANCE_INITIAL_STATE,
      isDetailsExpanded: IS_DETAILS_EXPANDED_INITIAL_STATE,
      isWritable: IS_WRITABLE_INITIAL_STATE,
      isGenuineMongoDB: GENUINE_IS,
      isGenuineMongoDBVisible: IS_VISIBLE_IS,
      isDataLake: DL_INITIAL_STATE,
    };
  }
  return reducer(state, action);
};

export default rootReducer;
