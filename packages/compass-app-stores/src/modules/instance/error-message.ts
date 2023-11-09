import type { RootAction } from '.';

/**
 * Create error message.
 */
export const CHANGE_ERROR_MESSAGE =
  'app/instance/CHANGE_ERROR_MESSAGE' as const;
interface ChangeErrorMessageAction {
  type: typeof CHANGE_ERROR_MESSAGE;
  errorMessage: string;
}
export type ErrorMessageAction = ChangeErrorMessageAction;
export type ErrorMessageState = string;

/**
 * The initial state of the error message.
 */
export const INITIAL_STATE: ErrorMessageState = '';

/**
 * Reducer function for handle state changes to error message.
 *
 * @param {String} state - The error message state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(
  state: ErrorMessageState = INITIAL_STATE,
  action: RootAction
): ErrorMessageState {
  if (action.type === CHANGE_ERROR_MESSAGE) {
    return action.errorMessage;
  }
  return state;
}

/**
 * The change error message action creator.
 *
 * @param {String} errorMessage - The errorMessage.
 *
 * @returns {Object} The action.
 */
export const changeErrorMessage = (
  errorMessage: string
): ChangeErrorMessageAction => ({
  type: CHANGE_ERROR_MESSAGE,
  errorMessage: errorMessage,
});
