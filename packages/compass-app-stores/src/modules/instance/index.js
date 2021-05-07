import { combineReducers } from 'redux';
import errorMessage, {
  INITIAL_STATE as ERROR_MESSAGE_INITIAL_STATE
} from 'modules/instance/error-message';
import instance, {
  INITIAL_STATE as INSTANCE_INITIAL_STATE
} from 'modules/instance/instance';
import dataService, {
  INITIAL_STATE as DATA_SERVICE_INITIAL_STATE
} from 'modules/instance/data-service';

import { RESET } from 'modules/instance/reset';
/**
 * The main reducer.
 */
const reducer = combineReducers({
  errorMessage,
  instance,
  dataService
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
      errorMessage: ERROR_MESSAGE_INITIAL_STATE,
      instance: INSTANCE_INITIAL_STATE,
      dataService: DATA_SERVICE_INITIAL_STATE
    };
  }
  return reducer(state, action);
};

export default rootReducer;
