import type { Reducer } from 'redux';

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
 */
const reducer: Reducer<string> = (state = INITIAL_STATE, action) => {
  if (action.type === NS_CHANGED) {
    return action.ns;
  }
  return state;
};

export default reducer;
export { nsChanged, NS_CHANGED };
