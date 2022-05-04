import { UUID } from 'bson';

/**
 * Reducer function for handle state changes to id.
 *
 * @param {String} state - The id state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = new UUID().toHexString()) {
  return state;
}
