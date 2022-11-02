import type { AnyAction } from 'redux';

/**
 * Action for the ns changing.
 */
const NS_CHANGED = 'import-export/ns/NS_CHANGED';

/**
 * The initial ns state.
 */
const INITIAL_STATE = '';

const nsChanged = (ns: string) => ({ type: NS_CHANGED, ns });

/**
 * Handle ns changes on the state.
 *
 * @param {String} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {String} The state.
 */
const reducer = (state = INITIAL_STATE, action: AnyAction) => {
  if (action.type === NS_CHANGED) {
    return action.ns;
  }
  return state;
};

export default reducer;
export { nsChanged, NS_CHANGED };
