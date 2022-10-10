import { CLONE_PIPELINE } from './clone-pipeline';
import { NEW_PIPELINE } from './import-pipeline';

/**
 * Set is modified action.
 */
export const SET_IS_MODIFIED = 'aggregations/is-modified/SET_IS_MODIFIED';

/**
 * The initial state.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to isModified.
 *
 * @param {Boolean} state - The isModified state.
 * @param {Object} action - The action.
 *
 * @returns {Boolean} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === SET_IS_MODIFIED) {
    return action.isModified;
  }
  if (action.type === CLONE_PIPELINE || action.type === NEW_PIPELINE) {
    return { ...INITIAL_STATE };
  }
  return state;
}

/**
 * Action creator for set is modified events.
 *
 * @param {Boolean} isModified - The isModified value.
 *
 * @returns {import("redux").AnyAction} The set is modified action.
 */
export const setIsModified = (isModified) => ({
  type: SET_IS_MODIFIED,
  isModified: isModified
});
