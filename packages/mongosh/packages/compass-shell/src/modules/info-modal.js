export const SET_SHOW_INFO_MODAL = 'SHELL/INFO_MODAL/SET_SHOW_INFO_MODAL';

export const INITIAL_STATE = {
  isInfoModalVisible: false
};

/**
 * Reducer function for handling actions with the info modal.
 *
 * @param {Object} state - The info modal state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === SET_SHOW_INFO_MODAL) {
    return {
      ...state,
      isInfoModalVisible: action.isInfoModalVisible
    };
  }

  return state;
}
