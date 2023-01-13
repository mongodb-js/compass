/**
 * The prefix.
 */
const PREFIX = 'export-to-language/modal-open';

/**
 * ModalOpen changed action.
 */
export const MODAL_OPEN_CHANGED = `${PREFIX}/MODAL_OPEN_CHANGED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to modalOpen.
 *
 * @param {String} state - The modalOpen state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === MODAL_OPEN_CHANGED) {
    return action.modalOpen;
  }

  return state;
}

/**
 * Action creator for modalOpen changed events.
 *
 * @param {Boolean} modalOpen - The modalOpen value.
 *
 * @returns {Object} The modalOpen changed action.
 */
export const modalOpenChanged = (modalOpen) => ({
  type: MODAL_OPEN_CHANGED,
  modalOpen,
});
