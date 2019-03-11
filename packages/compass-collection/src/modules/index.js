import { combineReducers } from 'redux';
import appRegistry, {
  INITIAL_STATE as APP_REGISTRY_INITIAL_STATE
} from './app-registry';
import dataService, {
  INITIAL_STATE as DATA_SERVICE_INITIAL_STATE
} from './data-service';
import serverVersion, {
  INITIAL_STATE as SERVER_VERSION_INITIAL_STATE
} from './server-version';
import tabs, {
  INITIAL_STATE as TABS_INITIAL_STATE
} from './tabs';

/**
 * Reset action constant.
 */
export const RESET = 'collection/reset';

/**
 * The initial state.
 */
export const INITIAL_STATE = {
  appRegistry: APP_REGISTRY_INITIAL_STATE,
  dataService: DATA_SERVICE_INITIAL_STATE,
  serverVersion: SERVER_VERSION_INITIAL_STATE,
  tabs: TABS_INITIAL_STATE
};

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
 *     isActive: true,
 *     isReadonly: false
 *   }
 * ]
 */
const appReducer = combineReducers({
  appRegistry,
  dataService,
  serverVersion,
  tabs
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
