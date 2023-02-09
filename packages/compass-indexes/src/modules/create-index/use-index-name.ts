import type { AnyAction } from 'redux';

/**
 * Toggle use index name action name.
 */
export const TOGGLE_USE_INDEX_NAME =
  'indexes/create-indexes/use-index-name/TOGGLE_USE_INDEX_NAME';

/**
 * The initial state of the use index name
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to the use index name.
 *
 * @param state - The use index name state.
 * @param action - The action.
 *
 * @returns The new state.
 */
export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): boolean {
  if (action.type === TOGGLE_USE_INDEX_NAME) {
    return action.useIndexName;
  }
  return state;
}

/**
 * The toggle use index name action creator.
 *
 * @param useIndexName - Use index name.
 *
 * @returns The action.
 */
export const toggleUseIndexName = (useIndexName: boolean) => ({
  type: TOGGLE_USE_INDEX_NAME,
  useIndexName,
});
