import { combineReducers } from 'redux';
import dataService from './data-service';
import appRegistry from './app-registry';
import { RESET } from './reset';
import isWritable, {
  INITIAL_STATE as WRITABLE_INITIAL_STATE
} from 'modules/is-writable';
import isReadonly, {
  INITIAL_STATE as READ_INITIAL_STATE
} from 'modules/is-readonly';
import description, {
  INITIAL_STATE as DESCRIPTION_INITIAL_STATE
} from 'modules/description';
import indexes, {
  INITIAL_STATE as INDEXES_INITIAL_STATE
} from 'modules/indexes';
import sortOrder, {
  INITIAL_STATE as SORT_ORDER_INITIAL_STATE
} from 'modules/sort-order';
import sortColumn, {
  INITIAL_STATE as SORT_COLUMN_INITIAL_STATE
} from 'modules/sort-column';
import error, {
  INITIAL_STATE as ERROR_INITIAL_STATE
} from 'modules/error';

/**
 * The main reducer.
 */
const reducer = combineReducers({
  indexes,
  isWritable,
  isReadonly,
  description,
  appRegistry,
  dataService,
  sortOrder,
  sortColumn,
  error
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
      isWritable: WRITABLE_INITIAL_STATE,
      isReadonly: READ_INITIAL_STATE,
      description: DESCRIPTION_INITIAL_STATE,
      indexes: INDEXES_INITIAL_STATE,
      sortOrder: SORT_ORDER_INITIAL_STATE,
      sortColumn: SORT_COLUMN_INITIAL_STATE,
      error: ERROR_INITIAL_STATE
    };
  }
  return reducer(state, action);
};

export default rootReducer;
