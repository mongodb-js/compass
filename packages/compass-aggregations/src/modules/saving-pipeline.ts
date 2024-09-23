import type { NewPipelineConfirmedAction } from './is-new-pipeline-confirm';
import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import { getPipelineFromBuilderState } from './pipeline-builder/builder-helpers';
import type { PipelineBuilderThunkAction } from '.';
import type { AnyAction } from 'redux';
import { isAction } from '@mongodb-js/compass-utils';

export const SAVING_PIPELINE_NAME_CHANGED =
  'aggregations/saving-pipeline/NAME_CHANGED' as const;
export interface SavingPipelineNameChangedAction {
  type: typeof SAVING_PIPELINE_NAME_CHANGED;
  name: string;
}

export const SAVING_PIPELINE_APPLY =
  'aggregations/saving-pipeline/APPLY' as const;
export interface SavingPipelineApplyAction {
  type: typeof SAVING_PIPELINE_APPLY;
  name: string;
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
  isSaveAs: boolean;
}
export type SavingPipelineAction =
  | SavingPipelineNameChangedAction
  | SavingPipelineApplyAction
  | SavingPipelineCancelAction
  | SavingPipelineOpenAction;

export interface SavingPipelineState {
  isOpen: boolean;
  name: string;
  isSaveAs: boolean;
}

/**
 * The initial state.
 */
export const INITIAL_STATE: SavingPipelineState = {
  isOpen: false,
  name: '',
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

  if (isAction<SavingPipelineOpenAction>(action, SAVING_PIPELINE_OPEN)) {
    return {
      ...state,
      isOpen: true,
      isSaveAs: action.isSaveAs,
      name: action.name,
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

/**
 * Action creator for apply name events handled in root reducer.
 */
export const savingPipelineApply =
  (): PipelineBuilderThunkAction<void, SavingPipelineApplyAction> =>
  (dispatch, getState) => {
    const {
      name: currentName,
      savingPipeline: { name },
    } = getState();

    dispatch({
      type: SAVING_PIPELINE_APPLY,
      name: currentName === name ? `${name} (copy)` : name,
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
 */
export const savingPipelineOpen = ({
  name = '',
  isSaveAs = false,
} = {}): SavingPipelineOpenAction => {
  return {
    type: SAVING_PIPELINE_OPEN,
    isSaveAs: isSaveAs,
    name: name,
  };
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
