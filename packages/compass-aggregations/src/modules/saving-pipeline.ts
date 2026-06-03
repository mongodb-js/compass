import type { NewPipelineConfirmedAction } from './is-new-pipeline-confirm';
import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import { getPipelineFromBuilderState } from './pipeline-builder/builder-helpers';
import type { PipelineBuilderThunkAction } from '.';
import type { AnyAction } from 'redux';
import { isAction } from '../utils/is-action';

export const SAVING_PIPELINE_NAME_CHANGED =
  'aggregations/saving-pipeline/NAME_CHANGED' as const;
export interface SavingPipelineNameChangedAction {
  type: typeof SAVING_PIPELINE_NAME_CHANGED;
  name: string;
}

export const SAVING_PIPELINE_DESCRIPTION_CHANGED =
  'aggregations/saving-pipeline/DESCRIPTION_CHANGED' as const;
export interface SavingPipelineDescriptionChangedAction {
  type: typeof SAVING_PIPELINE_DESCRIPTION_CHANGED;
  description: string;
}

export const SAVING_PIPELINE_MCP_PROMPT_NAME_CHANGED =
  'aggregations/saving-pipeline/MCP_PROMPT_NAME_CHANGED' as const;
export interface SavingPipelineMcpPromptNameChangedAction {
  type: typeof SAVING_PIPELINE_MCP_PROMPT_NAME_CHANGED;
  mcpPromptName: string;
}

export const SAVING_PIPELINE_APPLY =
  'aggregations/saving-pipeline/APPLY' as const;
export interface SavingPipelineApplyAction {
  type: typeof SAVING_PIPELINE_APPLY;
  name: string;
  /**
   * Carried alongside `name` so the top-level `description` /
   * `mcpPromptName` slices (mirror of `name.ts`) can pick it up — the
   * persisted pipeline reads from those after the modal resets.
   */
  description: string;
  mcpPromptName: string;
}

export const SAVING_PIPELINE_CANCEL =
  'aggregations/saving-pipeline/CANCEL' as const;
export interface SavingPipelineCancelAction {
  type: typeof SAVING_PIPELINE_CANCEL;
}

export const SAVING_PIPELINE_OPEN =
  'aggregations/saving-pipeline/OPEN' as const;
export interface SavingPipelineOpenAction {
  type: typeof SAVING_PIPELINE_OPEN;
  name: string;
  description: string;
  mcpPromptName: string;
  isSaveAs: boolean;
}
export type SavingPipelineAction =
  | SavingPipelineNameChangedAction
  | SavingPipelineDescriptionChangedAction
  | SavingPipelineMcpPromptNameChangedAction
  | SavingPipelineApplyAction
  | SavingPipelineCancelAction
  | SavingPipelineOpenAction;

export interface SavingPipelineState {
  isOpen: boolean;
  name: string;
  /** Free-text description, surfaced to AI agents via the MCP catalog. */
  description: string;
  /**
   * Optional slash-command name. When non-empty, the MCP server
   * publishes this saved pipeline as a prompt (`/<name>` in AI
   * clients). Validated kebab-case at submit time.
   */
  mcpPromptName: string;
  isSaveAs: boolean;
}

/**
 * The initial state.
 */
export const INITIAL_STATE: SavingPipelineState = {
  isOpen: false,
  name: '',
  description: '',
  mcpPromptName: '',
  isSaveAs: false,
};

/**
 * Reducer function for handle state changes to name in the save pipeline modal.
 *
 * @param {Object} state - The name state.
 * @param {Object} action - The action.
 *
 * @returns {any} The new state.
 */
export default function reducer(
  state: SavingPipelineState = INITIAL_STATE,
  action: AnyAction
): SavingPipelineState {
  if (
    isAction<SavingPipelineNameChangedAction>(
      action,
      SAVING_PIPELINE_NAME_CHANGED
    )
  ) {
    return {
      ...state,
      name: action.name,
    };
  }

  if (
    isAction<SavingPipelineDescriptionChangedAction>(
      action,
      SAVING_PIPELINE_DESCRIPTION_CHANGED
    )
  ) {
    return {
      ...state,
      description: action.description,
    };
  }

  if (
    isAction<SavingPipelineMcpPromptNameChangedAction>(
      action,
      SAVING_PIPELINE_MCP_PROMPT_NAME_CHANGED
    )
  ) {
    return {
      ...state,
      mcpPromptName: action.mcpPromptName,
    };
  }

  if (isAction<SavingPipelineOpenAction>(action, SAVING_PIPELINE_OPEN)) {
    return {
      ...state,
      isOpen: true,
      isSaveAs: action.isSaveAs,
      name: action.name,
      description: action.description,
      mcpPromptName: action.mcpPromptName,
    };
  }

  if (isAction<SavingPipelineCancelAction>(action, SAVING_PIPELINE_CANCEL)) {
    return {
      ...state,
      name: '',
      isOpen: false,
    };
  }

  if (
    isAction<SavingPipelineApplyAction>(action, SAVING_PIPELINE_APPLY) ||
    isAction<NewPipelineConfirmedAction>(
      action,
      ConfirmNewPipelineActions.NewPipelineConfirmed
    )
  ) {
    return { ...INITIAL_STATE };
  }

  return state;
}

/**
 * Action creator for name changed events.
 */
export const savingPipelineNameChanged = (
  name: string
): SavingPipelineNameChangedAction => ({
  type: SAVING_PIPELINE_NAME_CHANGED,
  name: name,
});

/** Action creator for description changes inside the save-pipeline modal. */
export const savingPipelineDescriptionChanged = (
  description: string
): SavingPipelineDescriptionChangedAction => ({
  type: SAVING_PIPELINE_DESCRIPTION_CHANGED,
  description,
});

/** Action creator for MCP prompt-name changes inside the save-pipeline modal. */
export const savingPipelineMcpPromptNameChanged = (
  mcpPromptName: string
): SavingPipelineMcpPromptNameChangedAction => ({
  type: SAVING_PIPELINE_MCP_PROMPT_NAME_CHANGED,
  mcpPromptName,
});

/**
 * Action creator for apply name events handled in root reducer.
 *
 * Reads name + description + mcpPromptName from the saving-pipeline
 * modal slice and dispatches them all together so the top-level
 * `name`, `description`, `mcpPromptName` reducers can persist them
 * before the modal's own state resets.
 */
export const savingPipelineApply =
  (): PipelineBuilderThunkAction<void, SavingPipelineApplyAction> =>
  (dispatch, getState) => {
    const {
      name: currentName,
      savingPipeline: { name, description, mcpPromptName },
    } = getState();

    dispatch({
      type: SAVING_PIPELINE_APPLY,
      name: currentName === name ? `${name} (copy)` : name,
      description: description.trim(),
      mcpPromptName: mcpPromptName.trim(),
    });
  };

/**
 * Action creator for cancel events.
 * @returns {Object} The name changed action.
 */
export const savingPipelineCancel = (): SavingPipelineCancelAction => ({
  type: SAVING_PIPELINE_CANCEL,
});

/**
 * Action creator for cancel events.
 *
 * Optionally seeds description + mcpPromptName so the modal opens with
 * the metadata currently persisted on the pipeline — saving an already-
 * described pipeline shouldn't blank those fields on each Save click.
 */
export const savingPipelineOpen = ({
  name = '',
  description = '',
  mcpPromptName = '',
  isSaveAs = false,
} = {}): SavingPipelineOpenAction => {
  return {
    type: SAVING_PIPELINE_OPEN,
    isSaveAs: isSaveAs,
    name: name,
    description,
    mcpPromptName,
  };
};

/**
 * Open the modal in `Save As` mode for the currently-loaded pipeline,
 * pre-filling description + mcpPromptName from the persisted record so
 * the user doesn't have to re-enter metadata they set when they
 * originally saved the pipeline. Use this from the Save menu rather
 * than calling `savingPipelineOpen` directly with a hand-built payload.
 */
export const openSaveAsModalForCurrentPipeline =
  (): PipelineBuilderThunkAction<void, SavingPipelineOpenAction> =>
  (dispatch, getState) => {
    const { name, description, mcpPromptName } = getState();
    dispatch(
      savingPipelineOpen({
        name,
        description,
        mcpPromptName,
        isSaveAs: true,
      })
    );
  };

/**
 * Open create view.
 *
 * @emits open-create-view {meta: {source, pipeline}}
 * @see create-view src/stores/create-view.js
 */
export const openCreateView = (): PipelineBuilderThunkAction<void> => {
  return (
    _dispatch,
    getState,
    { pipelineBuilder, globalAppRegistry, connectionInfoRef }
  ) => {
    const state = getState();
    const sourceNs = state.namespace;
    const sourcePipeline = getPipelineFromBuilderState(
      getState(),
      pipelineBuilder
    );

    const meta = {
      source: sourceNs,
      pipeline: sourcePipeline,
    };

    const { id: connectionId } = connectionInfoRef.current;

    globalAppRegistry.emit('open-create-view', meta, { connectionId });
  };
};
