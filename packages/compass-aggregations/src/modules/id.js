import { ObjectId } from 'bson';
import { CLONE_PIPELINE } from './clone-pipeline';
import { ActionTypes as ConfirmNewPipelineActions } from '././is-new-pipeline-confirm';
import { RESTORE_PIPELINE } from './saved-pipeline';
import { AIPipelineActionTypes } from './pipeline-builder/pipeline-ai';

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
    action.type === CLONE_PIPELINE ||
    action.type === AIPipelineActionTypes.LoadGeneratedPipeline ||
    action.type === ConfirmNewPipelineActions.NewPipelineConfirmed
  ) {
    return new ObjectId().toHexString();
  }
  if (action.type === RESTORE_PIPELINE) {
    return action.storedOptions.id;
  }
  return state;
}

/**
 * Action creator for id creation events.
 *
 * @returns {{ type: string }} The create id action.
 */
export const createId = () => ({
  type: CREATE_ID,
});
