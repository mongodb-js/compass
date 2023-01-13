import { combineReducers } from 'redux';
import appRegistry from '../app-registry';
import databases, {
  INITIAL_STATE as DATABASES_INITIAL_STATE,
} from './databases';
import databasesStatus, {
  INITIAL_STATE as DATABASES_STATUS_STATE,
} from './status';
import isReadonly, {
  INITIAL_STATE as READONLY_INITIAL_STATE,
} from '../is-readonly';
import isWritable, {
  INITIAL_STATE as WRITABLE_INITIAL_STATE,
} from '../is-writable';
import isGenuineMongoDB, {
  INITIAL_STATE as GENUINE_INITIAL_STATE,
} from '../is-genuine-mongodb';
import isDataLake, {
  INITIAL_STATE as DATA_LAKE_INITIAL_STATE,
} from '../is-data-lake';
import { RESET } from '../reset';

/**
 * The main reducer.
 */
const reducer = combineReducers({
  appRegistry,
  databases,
  databasesStatus,
  isReadonly,
  isWritable,
  isGenuineMongoDB,
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
      databases: DATABASES_INITIAL_STATE,
      databasesStatus: DATABASES_STATUS_STATE,
      isReadonly: READONLY_INITIAL_STATE,
      isWritable: WRITABLE_INITIAL_STATE,
      isGenuineMongoDB: GENUINE_INITIAL_STATE,
      isDataLake: DATA_LAKE_INITIAL_STATE,
    };
  }
  return reducer(state, action);
};

export default rootReducer;
