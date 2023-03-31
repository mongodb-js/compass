import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { track } = createLoggerAndTelemetry('COMPASS-SCHEMA-VALIDATION-UI');

/**
 * Zero state changed action.
 */
export const IS_ZERO_STATE_CHANGED =
  'validation/namespace/IS_ZERO_STATE_CHANGED';

/**
 * The initial state.
 */
export const INITIAL_STATE = true;

/**
 * Reducer function for handle state changes to namespace.
 *
 * @param {String} state - The namespace state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === IS_ZERO_STATE_CHANGED) {
    return action.isZeroState;
  }

  return state;
}

/**
 * Action creator for zero state changed events.
 *
 * @param {Boolean} isZeroState - Is zero state.
 *
 * @returns {Object} The zero state changed action.
 */
export const zeroStateChanged = (isZeroState) => ({
  type: IS_ZERO_STATE_CHANGED,
  isZeroState,
});

/**
 * Change zero state.
 *
 * @param {Boolean} isZeroState - Is zero state.
 *
 * @returns {Function} The function.
 */
export const changeZeroState = (isZeroState) => {
  return (dispatch) => {
    if (isZeroState === false) {
      track('Schema Validation Added');
    }
    return dispatch(zeroStateChanged(isZeroState));
  };
};
