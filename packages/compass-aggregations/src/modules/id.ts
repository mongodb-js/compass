import { ObjectId } from 'bson';
import { CLONE_PIPELINE } from './clone-pipeline';
import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import { RESTORE_PIPELINE } from './saved-pipeline';
import { AIPipelineActionTypes } from './pipeline-builder/pipeline-ai';
import type { RootAction } from '.';

/**
 * Id create action.
 */
export const CREATE_ID = 'aggregations/id/CREATE_ID' as const;
interface CreateIdAction {
  type: typeof CREATE_ID;
}
export type IdAction = CreateIdAction;
export type IdState = string;

/**
 * The initial state.
 */
export const INITIAL_STATE: IdState = '';

/**
 * Reducer function for handle state changes to id.
 */
export default function reducer(
  state: IdState = INITIAL_STATE,
  action: RootAction
): IdState {
  if (
    action.type === CREATE_ID ||
    action.type === CLONE_PIPELINE ||
    action.type === AIPipelineActionTypes.LoadGeneratedPipeline ||
    action.type === AIPipelineActionTypes.PipelineGeneratedFromQuery ||
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
