import { combineReducers } from 'redux';
import ns, {
  INITIAL_STATE as NS_INITIAL_STATE
} from 'modules/namespace/ns';

import { RESET } from 'modules/namespace/reset';
/**
 * The main reducer.
 */
const reducer = combineReducers({
  ns
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
      ns: NS_INITIAL_STATE
    };
  }
  return reducer(state, action);
};

export default rootReducer;
