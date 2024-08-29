import { UUID } from 'bson';
import type { Action, Reducer } from 'redux';

/**
 * Workspace id that allows to distinguish between different instances of the
 * aggregation plugin (different collection tabs on the screen). Helpful in
 * cases like when we need to differenciate between inflight aggregation
 * requests for stages separately for different tabs that can be opened in
 * Compass simultaneously
 */
const reducer: Reducer<string, Action> = (state = new UUID().toHexString()) => {
  return state;
};

export default reducer;
