import { combineReducers } from 'redux';
import appRegistry, {
  INITIAL_STATE as APP_REGISTRY_STATE,
} from '@mongodb-js/mongodb-redux-common/app-registry';
import inputExpression, {
  INITIAL_STATE as INPUT_EXPRESSION_INITIAL_STATE,
} from './input-expression';
import modalOpen, { INITIAL_STATE as MODAL_INITIAL_STATE } from './modal-open';
import uri, { INITIAL_STATE as URI_INITIAL_STATE } from './uri';
import namespace, { INITIAL_STATE as NS_INITIAL_STATE } from './namespace';

export const INITIAL_STATE = {
  inputExpression: INPUT_EXPRESSION_INITIAL_STATE,
  modalOpen: MODAL_INITIAL_STATE,
  uri: URI_INITIAL_STATE,
  namespace: NS_INITIAL_STATE,
  appRegistry: APP_REGISTRY_STATE,
};

/**
 * The reducer.
 */
const reducer = combineReducers({
  inputExpression,
  modalOpen,
  uri,
  namespace,
  appRegistry,
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
  return reducer(state, action);
};

export default rootReducer;
