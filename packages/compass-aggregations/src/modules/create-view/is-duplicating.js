/**
 * Toggle is duplicating action name.
 */
export const TOGGLE_IS_DUPLICATING = 'aggregations/create-view/is-duplicating/TOGGLE_IS_DUPLICATING';

export const INITIAL_STATE = false;

export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TOGGLE_IS_DUPLICATING) {
    return action.isDuplicating;
  }
  return state;
}

/**
 * The toggle is duplicating action creator.
 *
 * @param {Boolean} isDuplicating - Is duplicating.
 *
 * @returns {Object} The action.
 */
export const toggleIsDuplicating = (isDuplicating) => ({
  type: TOGGLE_IS_DUPLICATING,
  isDuplicating: isDuplicating
});
