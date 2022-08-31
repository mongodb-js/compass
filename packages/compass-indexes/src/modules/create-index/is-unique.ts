import type { AnyAction } from 'redux';

/**
 * Toggle is unique action name.
 */
export const TOGGLE_IS_UNIQUE =
  'indexes/create-indexes/is-unique/TOGGLE_IS_UNIQUE';

/**
 * The initial state of is unique.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle is unique state changes.
 *
 * @param state - The is unique state.
 * @param action - The action.
 *
 * @returns The new state.
 */
export default function reducer(state = INITIAL_STATE, action: AnyAction) {
  if (action.type === TOGGLE_IS_UNIQUE) {
    return action.isUnique;
  }
  return state;
}

/**
 * The toggle is unique action creator.
 *
 * @param isUnique - Is unique.
 *
 * @returns The action.
 */
export const toggleIsUnique = (isUnique: boolean) => ({
  type: TOGGLE_IS_UNIQUE,
  isUnique,
});
