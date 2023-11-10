import type { RootAction } from '.';

/**
 * Change is details expanded
 */
export const TOGGLE_IS_DETAILS_EXPANDED =
  'sidebar/is-details-expanded/TOGGLE_IS_DETAILS_EXPANDED' as const;
export interface ToggleIsDetailsExpandedAction {
  type: typeof TOGGLE_IS_DETAILS_EXPANDED;
  isExpanded: boolean;
}

/**
 * The initial state of the is expanded attribute.
 */
export const INITIAL_STATE: IsDetailsExpandedState = true;
export type IsDetailsExpandedState = boolean;

/**
 * Reducer function for handle state changes to is details expanded.
 *
 * @param {Boolean} state - The is expanded state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(
  state: IsDetailsExpandedState = INITIAL_STATE,
  action: RootAction
): IsDetailsExpandedState {
  if (action.type === TOGGLE_IS_DETAILS_EXPANDED) {
    return action.isExpanded;
  }
  return state;
}

/**
 * The toggle is details expanded action creator.
 *
 * @param {Boolean} isExpanded - Is the details section expanded
 *
 * @returns {Object} The action.
 */
export const toggleIsDetailsExpanded = (
  isExpanded: boolean
): ToggleIsDetailsExpandedAction => ({
  type: TOGGLE_IS_DETAILS_EXPANDED,
  isExpanded: isExpanded,
});
