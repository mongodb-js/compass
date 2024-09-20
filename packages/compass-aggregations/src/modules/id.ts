import { ObjectId } from 'bson';
import type { ClonePipelineAction } from './clone-pipeline';
import { CLONE_PIPELINE } from './clone-pipeline';
import type { NewPipelineConfirmedAction } from './is-new-pipeline-confirm';
import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import type { RestorePipelineAction } from './saved-pipeline';
import { RESTORE_PIPELINE } from './saved-pipeline';
import type {
  LoadGeneratedPipelineAction,
  PipelineGeneratedFromQueryAction,
} from './pipeline-builder/pipeline-ai';
import { AIPipelineActionTypes } from './pipeline-builder/pipeline-ai';
import type { AnyAction } from 'redux';
import { isAction } from '@mongodb-js/compass-utils';

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
  action: AnyAction
): IdState {
  if (
    isAction<CreateIdAction>(action, CREATE_ID) ||
    isAction<ClonePipelineAction>(action, CLONE_PIPELINE) ||
    isAction<LoadGeneratedPipelineAction>(
      action,
      AIPipelineActionTypes.LoadGeneratedPipeline
    ) ||
    isAction<PipelineGeneratedFromQueryAction>(
      action,
      AIPipelineActionTypes.PipelineGeneratedFromQuery
    ) ||
    isAction<NewPipelineConfirmedAction>(
      action,
      ConfirmNewPipelineActions.NewPipelineConfirmed
    )
  ) {
    return new ObjectId().toHexString();
  }
  if (isAction<RestorePipelineAction>(action, RESTORE_PIPELINE)) {
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
