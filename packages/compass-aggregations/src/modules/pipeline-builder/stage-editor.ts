import type { Reducer } from 'redux';
import type { Document, MongoServerError } from 'mongodb';
import type {
  PipelineInitAction,
  PipelineLoadAction,
  PipelineResetAction
} from './';
import type { PipelineBuilderThunkAction } from './util';
import { isAction } from './util';
import { isCancelError } from '../../utils/cancellable-promise';
import type { Stage } from './pipeline-builder';

export const STAGE_PREVIEW_FETCH = 'STAGE_PREVIEW_FETCH';

export type StagePreviewFetchAction = {
  type: typeof STAGE_PREVIEW_FETCH;
  id: number;
};

export const STAGE_PREVIEW_FETCH_SUCCESS = 'STAGE_PREVIEW_FETCH_SUCCESS';

export type StagePreviewFetchSuccessAction = {
  type: typeof STAGE_PREVIEW_FETCH_SUCCESS;
  id: number;
  previewDocs: Document[];
};

export const STAGE_PREVIEW_FETCH_ERROR = 'STAGE_PREVIEW_FETCH_ERROR';

export type StagePreviewFetchErrorAction = {
  type: typeof STAGE_PREVIEW_FETCH_ERROR;
  id: number;
  error: MongoServerError;
};

export const STAGE_VALUE_CHANGE = 'STAGE_VALUE_CHANGE';

export type ChangeStageValueAction = {
  type: typeof STAGE_VALUE_CHANGE;
  id: number;
  stage: Stage;
};

export const STAGE_OPERATOR_CHANGE = 'STAGE_OPERATOR_CHANGE';

export type ChangeStageOperatorAction = {
  type: typeof STAGE_OPERATOR_CHANGE;
  id: number;
  stage: Stage;
};

export const STAGE_COLLAPSED_CHANGE = 'STAGE_COLLAPSED_CHANGE';

export type ChangeStageCollapsedAction = {
  type: typeof STAGE_COLLAPSED_CHANGE;
  id: number;
  collapsed: boolean;
};

export const STAGE_DISABLED_CHANGE = 'STAGE_DISABLED_CHANGE';

export type ChangeStageDisabledAction = {
  type: typeof STAGE_DISABLED_CHANGE;
  id: number;
  disabled: boolean;
};

export const STAGE_ADDED = 'STAGE_ADDED';

export type StageAddAction = {
  type: typeof STAGE_ADDED;
  after?: number;
  stage: Stage;
};

export const STAGE_REMOVED = 'STAGE_REMOVED';

export type StageRemoveAction = {
  type: typeof STAGE_REMOVED;
  at: number;
};

export const STAGE_MOVED = 'STAGE_MOVED';

export type StageMoveAction = {
  type: typeof STAGE_MOVED;
  from: number;
  to: number;
};

function canRunStage(stage?: StageEditorState['stages'][number]): boolean {
  if (
    !stage ||
    stage.value == null ||
    stage.syntaxError ||
    !stage.stageOperator ||
    ['$out', '$merge'].includes(stage.stageOperator)
  ) {
    return false;
  }

  return true;
}

export const loadStagePreview = (
  idx: number
): PipelineBuilderThunkAction<
  Promise<void>,
  | StagePreviewFetchAction
  | StagePreviewFetchSuccessAction
  | StagePreviewFetchErrorAction
> => {
  return async (dispatch, getState, { pipelineBuilder }) => {
    const {
      namespace,
      pipelineBuilder: {
        stageEditor: { stages }
      },
      autoPreview
    } = getState();

    if (!autoPreview) {
      return;
    }

    if (stages[idx].disabled) {
      return;
    }

    if (
      // Only run stage if all previous ones are valid (otherwise it will fail
      // anyway)
      !stages.slice(0, idx + 1).every((stage) => {
        return canRunStage(stage);
      })
    ) {
      return;
    }

    try {
      dispatch({
        type: STAGE_PREVIEW_FETCH,
        id: idx
      });
      const options = /* TODO */ {};
      const previewDocs = await pipelineBuilder.getPreviewForStage(
        idx,
        namespace,
        options
      );
      dispatch({
        type: STAGE_PREVIEW_FETCH_SUCCESS,
        id: idx,
        previewDocs
      });
    } catch (err) {
      if (isCancelError(err)) {
        return;
      }
      dispatch({
        type: STAGE_PREVIEW_FETCH_ERROR,
        id: idx,
        error: err as MongoServerError
      });
    }
  };
};

export const loadPreviewForStagesFrom = (
  from: number
): PipelineBuilderThunkAction<void> => {
  return (dispatch, getState) => {
    getState()
      .pipelineBuilder.stageEditor.stages.slice(from)
      .forEach((_, id) => {
        void dispatch(loadStagePreview(from + id));
      });
  };
};

export const changeStageValue = (
  id: number,
  newVal: string
): PipelineBuilderThunkAction<void, ChangeStageValueAction> => {
  return (dispatch, getState, { pipelineBuilder }) => {
    const stage = pipelineBuilder.getStage(id);
    if (!stage) {
      return;
    }
    stage.changeValue(newVal);
    dispatch({ type: STAGE_VALUE_CHANGE, id, stage });
    dispatch(loadPreviewForStagesFrom(id));
  };
};

export const changeStageOperator = (
  id: number,
  newVal: string
): PipelineBuilderThunkAction<void, ChangeStageOperatorAction> => {
  return (dispatch, getState, { pipelineBuilder }) => {
    const stage = pipelineBuilder.getStage(id);
    if (!stage) {
      return;
    }
    if (stage.operator === newVal) {
      return;
    }
    stage.changeOperator(newVal);
    dispatch({ type: STAGE_OPERATOR_CHANGE, id, stage });
    // TODO: Change operator value based on stuff (see stage-operator-select.js)
    // if (valueNotChangedAndIsCommentOrSomething) {
    //   dispatch(changeStageValue(id, defaultValueForStage[stage.stageOperator]))
    // }
    dispatch(loadPreviewForStagesFrom(id));
  };
};

export const changeStageDisabled = (
  id: number,
  newVal: boolean
): PipelineBuilderThunkAction<void, ChangeStageDisabledAction> => {
  return (dispatch, getState, { pipelineBuilder }) => {
    const stage = pipelineBuilder.getStage(id);
    if (!stage) {
      return;
    }
    stage.changeDisabled(newVal);
    dispatch({ type: STAGE_DISABLED_CHANGE, id, disabled: newVal });
    dispatch(loadPreviewForStagesFrom(id));
  };
};

export const changeStageCollapsed = (
  id: number,
  newVal: boolean
): ChangeStageCollapsedAction => {
  return { type: STAGE_COLLAPSED_CHANGE, id, collapsed: newVal };
};

export const addStage = (
  after?: number
): PipelineBuilderThunkAction<void, StageAddAction> => {
  return (dispatch, getState, { pipelineBuilder }) => {
    const stage = pipelineBuilder.addStage(after);
    dispatch({ type: STAGE_ADDED, after, stage });
  };
};

export const removeStage = (
  at: number
): PipelineBuilderThunkAction<void, StageRemoveAction> => {
  return (dispatch, getState, { pipelineBuilder }) => {
    pipelineBuilder.removeStage(at);
    dispatch({ type: STAGE_REMOVED, at });
    dispatch(loadPreviewForStagesFrom(at));
  };
};

export const moveStage = (
  from: number,
  to: number
): PipelineBuilderThunkAction<void, StageMoveAction> => {
  return (dispatch, getState, { pipelineBuilder }) => {
    if (from === to) {
      return;
    }
    pipelineBuilder.moveStage(from, to);
    dispatch({ type: STAGE_MOVED, from, to });
    dispatch(loadPreviewForStagesFrom(Math.min(from, to)));
  };
};

export type StageEditorState = {
  stagesCount: number;
  stages: {
    stageOperator: string | null;
    value: string | null;
    syntaxError: SyntaxError | null;
    serverError: MongoServerError | null;
    loading: boolean;
    previewDocs: Document[] | null;
    collapsed: boolean;
    disabled: boolean;
  }[];
};

function mapBuilderStageToStoreStage(
  stage: Stage
): StageEditorState['stages'][number] {
  return {
    stageOperator: stage.operator,
    value: stage.value,
    syntaxError: stage.syntaxError,
    disabled: stage.disabled,
    serverError: null,
    loading: false,
    previewDocs: null,
    collapsed: false
  };
}

const reducer: Reducer<StageEditorState> = (
  state = { stagesCount: 0, stages: [] },
  action
) => {
  if (
    isAction<PipelineInitAction>(action, 'PIPELINE_INIT') ||
    isAction<PipelineResetAction>(action, 'PIPELINE_RESET') ||
    isAction<PipelineLoadAction>(action, 'PIPELINE_LOAD')
  ) {
    return {
      stagesCount: action.stages.length,
      stages: action.stages.map((stage) => {
        return mapBuilderStageToStoreStage(stage);
      })
    };
  }

  if (isAction<StagePreviewFetchAction>(action, STAGE_PREVIEW_FETCH)) {
    return {
      ...state,
      stages: [
        ...state.stages.slice(0, action.id),
        {
          ...state.stages[action.id],
          loading: true
        },
        ...state.stages.slice(action.id + 1)
      ]
    };
  }

  if (
    isAction<StagePreviewFetchSuccessAction>(
      action,
      STAGE_PREVIEW_FETCH_SUCCESS
    )
  ) {
    return {
      ...state,
      stages: [
        ...state.stages.slice(0, action.id),
        {
          ...state.stages[action.id],
          loading: false,
          previewDocs: action.previewDocs,
          serverError: null
        },
        ...state.stages.slice(action.id + 1)
      ]
    };
  }

  if (
    isAction<StagePreviewFetchErrorAction>(action, STAGE_PREVIEW_FETCH_ERROR)
  ) {
    return {
      ...state,
      stages: [
        ...state.stages.slice(0, action.id),
        {
          ...state.stages[action.id],
          loading: false,
          serverError: action.error
        },
        ...state.stages.slice(action.id + 1)
      ]
    };
  }

  if (isAction<ChangeStageValueAction>(action, STAGE_VALUE_CHANGE)) {
    return {
      ...state,
      stages: [
        ...state.stages.slice(0, action.id),
        {
          ...state.stages[action.id],
          value: action.stage.value,
          syntaxError: action.stage.syntaxError
        },
        ...state.stages.slice(action.id + 1)
      ]
    };
  }

  if (isAction<ChangeStageOperatorAction>(action, STAGE_OPERATOR_CHANGE)) {
    return {
      ...state,
      stages: [
        ...state.stages.slice(0, action.id),
        {
          ...state.stages[action.id],
          stageOperator: action.stage.operator,
          syntaxError: action.stage.syntaxError
        },
        ...state.stages.slice(action.id + 1)
      ]
    };
  }

  if (isAction<ChangeStageDisabledAction>(action, STAGE_DISABLED_CHANGE)) {
    return {
      ...state,
      stages: [
        ...state.stages.slice(0, action.id),
        {
          ...state.stages[action.id],
          disabled: action.disabled
        },
        ...state.stages.slice(action.id + 1)
      ]
    };
  }

  if (isAction<ChangeStageCollapsedAction>(action, STAGE_COLLAPSED_CHANGE)) {
    return {
      ...state,
      stages: [
        ...state.stages.slice(0, action.id),
        {
          ...state.stages[action.id],
          collapsed: action.collapsed
        },
        ...state.stages.slice(action.id + 1)
      ]
    };
  }

  if (isAction<StageAddAction>(action, STAGE_ADDED)) {
    const after = action.after ?? state.stages.length;
    const stages = [...state.stages];
    stages.splice(after + 1, 0, mapBuilderStageToStoreStage(action.stage));
    return {
      ...state,
      stagesCount: stages.length,
      stages
    };
  }

  if (isAction<StageRemoveAction>(action, STAGE_REMOVED)) {
    const stages = [...state.stages];
    stages.splice(action.at, 1);
    return {
      ...state,
      stagesCount: stages.length,
      stages
    };
  }

  if (isAction<StageMoveAction>(action, STAGE_MOVED)) {
    const stages = [...state.stages];
    const movedStage = stages.splice(action.from, 1)[0];
    stages.splice(action.to, 0, movedStage);
    return {
      ...state,
      stages
    };
  }

  return state;
};

export default reducer;
