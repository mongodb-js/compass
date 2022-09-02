import type { AnyAction } from 'redux';

/**
 * Toggle use custom collation action name.
 */
export const TOGGLE_USE_CUSTOM_COLLATION =
  'indexes/create-index/use-custom-collation/TOGGLE_USE_CUSTOM_COLLATION';

/**
 * The initial state of the use custom collation attribute.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to the use custom collation.
 *
 * @param state - The use custom collation state.
 * @param action - The action.
 *
 * @returns The new state.
 */
export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): boolean {
  if (action.type === TOGGLE_USE_CUSTOM_COLLATION) {
    return action.useCustomCollation;
  }
  return state;
}

/**
 * The toggle use custom collation action creator.
 *
 * @param useCustomCollation - Is a custom collation.
 *
 * @returns The action.
 */
export const toggleUseCustomCollation = (useCustomCollation: boolean) => ({
  type: TOGGLE_USE_CUSTOM_COLLATION,
  useCustomCollation,
});
