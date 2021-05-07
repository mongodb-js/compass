import UI_STATES from 'constants/ui-states';

/**
 * UI status action.
 */
export const CHANGE_UI_STATUS = 'home/ui-status/CHANGE_UI_STATUS';

/**
 * The initial state of the UI status.
 */
export const INITIAL_STATE = UI_STATES.INITIAL;

/**
 * Reducer function for handle state changes to UI status.
 *
 * @param {String} state - The uI status state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_UI_STATUS) {
    return action.uiStatus;
  }
  return state;
}

/**
 * The change uiStatus action creator.
 *
 * @param {String} uiStatus - The UI status.
 *
 * @returns {Object} The action.
 */
export const changeUiStatus = (uiStatus) => ({
  type: CHANGE_UI_STATUS,
  uiStatus: uiStatus
});
