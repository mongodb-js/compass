import { ON_PREM } from 'mongodb-ace-autocompleter';
/**
 * The initial state.
 */
export const INITIAL_STATE = ON_PREM;

/**
 * Reducer function for handle state changes to env.
 *
 * @param {String} state - The env state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE) {
  return state;
}
