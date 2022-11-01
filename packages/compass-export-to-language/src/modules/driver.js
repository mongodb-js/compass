/**
 * The prefix.
 */
const PREFIX = 'export-to-language/driver';

/**
 * Driver changed action.
 */
export const DRIVER_CHANGED = `${PREFIX}/DRIVER_CHANGED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to driver.
 *
 * @param {String} state - The driver state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === DRIVER_CHANGED) {
    return action.driver;
  }

  return state;
}

/**
 * Action creator for driver changed events.
 *
 * @param {String} driver - The driver value.
 *
 * @returns {Object} The driver changed action.
 */
export const driverChanged = (driver) => ({
  type: DRIVER_CHANGED,
  driver,
});
