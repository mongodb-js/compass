import type { Action, Reducer } from 'redux';

import type { NewPipelineConfirmedAction } from './is-new-pipeline-confirm';
import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import type {
  LoadGeneratedPipelineAction,
  PipelineGeneratedFromQueryAction,
} from './pipeline-builder/pipeline-ai';
import { AIPipelineActionTypes } from './pipeline-builder/pipeline-ai';
import type { RestorePipelineAction } from './saved-pipeline';
import { RESTORE_PIPELINE } from './saved-pipeline';
import type { SavingPipelineApplyAction } from './saving-pipeline';
import { SAVING_PIPELINE_APPLY } from './saving-pipeline';
import { isAction } from '../utils/is-action';

/**
 * Optional kebab-case slash-command name for the saved pipeline. When
 * non-empty, the MCP server publishes this pipeline as a prompt so AI
 * clients (Claude Desktop, Cursor, …) surface it in their slash menu
 * — e.g. `/active-customers`. Same lifecycle as the `name` slice.
 */
export type McpPromptNameState = string;

export const INITIAL_STATE: McpPromptNameState = '';

const reducer: Reducer<McpPromptNameState, Action> = (
  state = INITIAL_STATE,
  action
) => {
  if (isAction<SavingPipelineApplyAction>(action, SAVING_PIPELINE_APPLY)) {
    return action.mcpPromptName;
  }
  if (
    isAction<NewPipelineConfirmedAction>(
      action,
      ConfirmNewPipelineActions.NewPipelineConfirmed
    ) ||
    isAction<LoadGeneratedPipelineAction>(
      action,
      AIPipelineActionTypes.LoadGeneratedPipeline
    ) ||
    isAction<PipelineGeneratedFromQueryAction>(
      action,
      AIPipelineActionTypes.PipelineGeneratedFromQuery
    )
  ) {
    return INITIAL_STATE;
  }
  if (isAction<RestorePipelineAction>(action, RESTORE_PIPELINE)) {
    return action.storedOptions.mcpPromptName ?? INITIAL_STATE;
  }
  return state;
};

export default reducer;
