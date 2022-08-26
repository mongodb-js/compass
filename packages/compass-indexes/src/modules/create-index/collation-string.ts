import type { AnyAction } from 'redux';

/**
 * Collation string changed action name.
 */
export const COLLATION_STRING_CHANGED =
  'aggregations/collation/COLLATION_STRING_CHANGED';

/**
 * The initial state of the collation string.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle the collation string state changes.
 *
 * @param {String} state - The collation string state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
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
 * Action creator for the collation string changed event.
 *
 * @param {String} collationString - The collation string.
 *
 * @returns {Object} The action.
 */
export const collationStringChanged = (collationString: string): AnyAction => {
  return { type: COLLATION_STRING_CHANGED, collationString };
};
