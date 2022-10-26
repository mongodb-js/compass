import { combineReducers } from 'redux';
import appRegistry from '../app-registry';
import collections, {
  INITIAL_STATE as COLLECTIONS_INITIAL_STATE
} from './collections';
import collectionsStatus, {
  INITIAL_STATE as COLLECTIONS_STATUS_STATE
} from './status';
import databaseName, {
  INITIAL_STATE as DATABASE_NAME_INITIAL_STATE
} from '../database-name';
import isReadonly, {
  INITIAL_STATE as READONLY_INITIAL_STATE
} from '../is-readonly';
import preferencesReadOnly, {
  INITIAL_STATE as PREFERENCES_READONLY_INITIAL_STATE
} from '../preferences-readonly';
import isWritable, {
  INITIAL_STATE as WRITABLE_INITIAL_STATE
} from '../is-writable';
import isDataLake, {
  INITIAL_STATE as DATA_LAKE_INITIAL_STATE
} from '../is-data-lake';
import { RESET } from '../reset';

/**
 * The main reducer.
 */
const reducer = combineReducers({
  appRegistry,
  databaseName,
  collections,
  collectionsStatus,
  isReadonly,
  preferencesReadOnly,
  isWritable,
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
      databaseName: DATABASE_NAME_INITIAL_STATE,
      collections: COLLECTIONS_INITIAL_STATE,
      collectionsStatus: COLLECTIONS_STATUS_STATE,
      isReadonly: READONLY_INITIAL_STATE,
      preferencesReadOnly: PREFERENCES_READONLY_INITIAL_STATE,
      isWritable: WRITABLE_INITIAL_STATE,
      isDataLake: DATA_LAKE_INITIAL_STATE
    };
  }
  return reducer(state, action);
};

export default rootReducer;
