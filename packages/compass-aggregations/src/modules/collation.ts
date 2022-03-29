import type { CollationOptions } from 'mongodb';
import type { AnyAction } from 'redux';
import queryParser from 'mongodb-query-parser';

/**
 * Collation action.
 */
export const COLLATION_CHANGED = 'aggregations/collation/COLLATION_CHANGED';

type State = CollationOptions | false | null;

/**
 * The collation initial state.
 */
export const INITIAL_STATE: State = null;

/**
 * Reducer function for handle collation state changes.
 */
export default function reducer(state = INITIAL_STATE, action: AnyAction): State {
  if (action.type === COLLATION_CHANGED) {
    return action.collation;
  }
  return state;
}

/**
 * Action creator for collation event.
 */
export const collationChanged = (collation: string): AnyAction => {
  return {
    type: COLLATION_CHANGED,
    // Returns collation if valid, or false
    collation: queryParser.isCollationValid(collation),
  };
};
