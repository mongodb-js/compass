import { combineReducers } from 'redux';
import appRegistry from './app-registry';
import dataService from './data-service';
import serverVersion from './server-version';

/**
 * Reset action constant.
 */
export const RESET = 'collection/reset';

/**
 * The initial state.
 */
const INITIAL_STATE = {};

/**
 * Handle the reset.
 *
 * @returns {Object} The new state.
 */
const doReset = () => ({
  ...INITIAL_STATE
});

/**
 * The action to state modifier mappings.
 */
const MAPPINGS = {
  [RESET]: doReset
};

/**
 * appRegistry,
 * dataService,
 * serverVersion,
 * tabs: [
 *   {
 *     namespace: 'db.coll',
 *     isSelected: true,
 *     isReadonly: false,
 *     isCapped: false,
 *     activeTabIndex: 3,
 *   }
 * ]
 */
const appReducer = combineReducers({
  appRegistry,
  dataService,
  serverVersion
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
  const fn = MAPPINGS[action.type];
  return fn ? fn(state, action) : appReducer(state, action);
};

export default rootReducer;

/**
 * Reset the entire state.
 *
 * @returns {Object} The action.
 */
export const reset = () => ({
  type: RESET
});
