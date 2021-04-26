/**
 * The prefix.
 */
const PREFIX = 'sidebar/is-modal-visible';

/**
 * Toggle is modal visible action.
 */
export const TOGGLE_IS_MODAL_VISIBLE = `${PREFIX}/TOGGLE_IS_MODAL_VISIBLE`;

/**
 * The initial state of the is modal visible attribute.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state change of the is modal visible attribute.
 *
 * @param {String} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TOGGLE_IS_MODAL_VISIBLE) {
    return action.isModalVisible;
  }
  return state;
}

/**
 * Toggle is modal visible action creator.
 *
 * @param {Boolean} isModalVisible - The is modal visible attribute.
 *
 * @returns {Object} The action.
 */
export const toggleIsModalVisible = (isModalVisible) => ({
  type: TOGGLE_IS_MODAL_VISIBLE,
  isModalVisible
});
