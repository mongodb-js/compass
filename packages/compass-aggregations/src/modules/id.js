import { ObjectId } from 'bson';
import { CLONE_PIPELINE } from './clone-pipeline';
import { CONFIRM_NEW, NEW_PIPELINE } from './import-pipeline';
import { RESTORE_PIPELINE } from './saved-pipeline';

/**
 * Id create action.
 */
export const CREATE_ID = 'aggregations/id/CREATE_ID';

/**
 * The initial state.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle state changes to id.
 *
 * @param {String} state - The id state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (
    action.type === CREATE_ID ||
    action.type === CONFIRM_NEW ||
    action.type === CLONE_PIPELINE ||
    action.type === NEW_PIPELINE
  ) {
    return new ObjectId().toHexString();
  }
  if (action.type === RESTORE_PIPELINE) {
    return action.restoreState.id;
  }
  return state;
}

/**
 * Action creator for id creation events.
 *
 * @returns {{ type: string }} The create id action.
 */
export const createId = () => ({
  type: CREATE_ID
});
