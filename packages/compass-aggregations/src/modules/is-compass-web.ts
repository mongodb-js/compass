/**
 * The initial state.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to isCompassWeb.
 * This indicates whether the app is running in Compass Web (Data Explorer)
 * vs Compass desktop.
 */
export default function reducer(state: boolean = INITIAL_STATE): boolean {
  return state;
}
