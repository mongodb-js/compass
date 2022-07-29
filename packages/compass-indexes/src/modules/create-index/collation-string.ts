import type { AnyAction } from 'redux';

/**
 * Collation string changed action.
 */
export const COLLATION_STRING_CHANGED =
  'aggregations/collation/COLLATION_STRING_CHANGED';

/**
 * The collation string initial state.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle collation string state changes.
 */
export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): string {
  if (action.type === COLLATION_STRING_CHANGED) {
    return action.collationString;
  }
  return state;
}

/**
 * Action creator for collation string changed event.
 */
export const collationStringChanged = (collationString: string): AnyAction => {
  return { type: COLLATION_STRING_CHANGED, collationString };
};
