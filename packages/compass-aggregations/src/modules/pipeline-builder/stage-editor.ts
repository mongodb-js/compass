import type { Reducer } from 'redux';
import type { AggregateOptions, Document, MongoServerError } from 'mongodb';
import { globalAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';
import { RESTORE_PIPELINE } from '../saved-pipeline';
import type { PipelineBuilderThunkAction } from '../';
import { isAction } from '../../utils/is-action';
import type Stage from './stage';
import { ActionTypes as ConfirmNewPipelineActions } from '../is-new-pipeline-confirm';
import type { ENVS } from '@mongodb-js/mongodb-constants';
import { STAGE_OPERATORS } from '@mongodb-js/mongodb-constants';
import { DEFAULT_MAX_TIME_MS } from '../../constants';
import type { PreviewOptions } from './pipeline-preview-manager';
import {
  DEFAULT_PREVIEW_LIMIT,
  DEFAULT_SAMPLE_SIZE,
} from './pipeline-preview-manager';
import { aggregatePipeline } from '../../utils/cancellable-aggregation';
import type { PipelineParserError } from './pipeline-parser/utils';
import { ActionTypes as PipelineModeActionTypes } from './pipeline-mode';
import type { PipelineModeToggledAction } from './pipeline-mode';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { isOutputStage } from '../../utils/stage';
import { mapPipelineModeToEditorViewType } from './builder-helpers';
import { getId } from './stage-ids';
const { track } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

export const enum StageEditorActionTypes {
  StagePreviewFetch = 'compass-aggregations/pipeline-builder/stage-editor/StagePreviewFetch',
  StagePreviewFetchSkipped = 'compass-aggregations/pipeline-builder/stage-editor/StagePreviewFetchSkipped',
  StagePreviewFetchSuccess = 'compass-aggregations/pipeline-builder/stage-editor/StagePreviewFetchSuccess',
  StagePreviewFetchError = 'compass-aggregations/pipeline-builder/stage-editor/StagePreviewFetchError',
  StageRun = 'compass-aggregations/pipeline-builder/stage-editor/StageRun',
  StageRunSuccess = 'compass-aggregations/pipeline-builder/stage-editor/StageRunSuccess',
  StageRunError = 'compass-aggregations/pipeline-builder/stage-editor/StagePreviewFetchError',
  StageValueChange = 'compass-aggregations/pipeline-builder/stage-editor/StageValueChange',
  StageOperatorChange = 'compass-aggregations/pipeline-builder/stage-editor/StageOperatorChange',
  StageCollapsedChange = 'compass-aggregations/pipeline-builder/stage-editor/StageCollapsedChange',
  StageDisabledChange = 'compass-aggregations/pipeline-builder/stage-editor/StageDisabledChange',
  StageAdded = 'compass-aggregations/pipeline-builder/stage-editor/StageAdded',
  StageRemoved = 'compass-aggregations/pipeline-builder/stage-editor/StageRemoved',
  StageMoved = 'compass-aggregations/pipeline-builder/stage-editor/StageMoved',
  WizardAdded = 'compass-aggregations/pipeline-builder/stage-wizard/WizardAdded',
}

export type StagePreviewFetchAction = {
  type: StageEditorActionTypes.StagePreviewFetch;
  id: number;
};

export type StagePreviewFetchSkippedAction = {
  type: StageEditorActionTypes.StagePreviewFetchSkipped;
  id: number;
};

export type StagePreviewFetchSuccessAction = {
  type: StageEditorActionTypes.StagePreviewFetchSuccess;
  id: number;
  previewDocs: Document[];
};

export type StagePreviewFetchErrorAction = {
  type: StageEditorActionTypes.StagePreviewFetchError;
  id: number;
  error: MongoServerError;
};

export type StageRunAction = {
  type: StageEditorActionTypes.StageRun;
  id: number;
};

export type StageRunSuccessAction = {
  type: StageEditorActionTypes.StageRunSuccess;
  id: number;
  previewDocs: Document[];
};

export type StageRunErrorAction = {
  type: StageEditorActionTypes.StageRunError;
  id: number;
  error: MongoServerError;
};

export type ChangeStageValueAction = {
  type: StageEditorActionTypes.StageValueChange;
  id: number;
  stage: Stage;
};

export type ChangeStageOperatorAction = {
  type: StageEditorActionTypes.StageOperatorChange;
  id: number;
  stage: Stage;
};

export type ChangeStageCollapsedAction = {
  type: StageEditorActionTypes.StageCollapsedChange;
  id: number;
  collapsed: boolean;
};

export type ChangeStageDisabledAction = {
  type: StageEditorActionTypes.StageDisabledChange;
  id: number;
  disabled: boolean;
};

export type StageAddAction = {
  type: StageEditorActionTypes.StageAdded;
  after: number;
  stage: Stage;
};

export type StageRemoveAction = {
  type: StageEditorActionTypes.StageRemoved;
  at: number;
};

export type StageMoveAction = {
  type: StageEditorActionTypes.StageMoved;
  from: number;
  to: number;
};

export type WizardAddedAction = {
  type: StageEditorActionTypes.WizardAdded;
  usecaseId: number;
  formValues: unknown;
  after: number;
};

export function storeIndexToPipelineIndex(
  stages: StageEditorState['stages'],
  indexInStore: number,
  { includeIndex } = { includeIndex: false }
): number {
  const endBound = includeIndex ? indexInStore + 1 : indexInStore;
  const considerableStages = stages.slice(0, endBound);
  const totalWizards = considerableStages.filter(
    ({ type }) => type === 'wizard'
  );
  return indexInStore - totalWizards.length;
}

function canRunStage(stage?: ReduxStage, allowOut = false): boolean {
  return (
    !!stage &&
    (stage.disabled ||
      (!stage.syntaxError &&
        !!stage.value &&
        !!stage.stageOperator &&
        (allowOut || !isOutputStage(stage.stageOperator))))
  );
}

export const loadStagePreview = (
  idx: number
): PipelineBuilderThunkAction<
  Promise<void>,
  | StagePreviewFetchAction
  | StagePreviewFetchSuccessAction
  | StagePreviewFetchErrorAction
  | StagePreviewFetchSkippedAction
> => {
  return async (dispatch, getState, { pipelineBuilder }) => {
    const {
      pipelineBuilder: {
        stageEditor: { stages },
      },
      dataService,
      autoPreview,
    } = getState();

    const pipeline = stages.filter(
      (stage): stage is ReduxStage => stage.type === 'stage'
    );
    const idxInPipeline = storeIndexToPipelineIndex(stages, idx);

    // Ignoring the state of the stage, always try to stop current preview fetch
    pipelineBuilder.cancelPreviewForStage(idxInPipeline);
    const stage = pipeline[idxInPipeline];

    const canFetchPreviewForStage =
      autoPreview &&
      !stage.disabled &&
      // Only run stage if all previous ones are valid (otherwise it will fail
      // anyway)
      pipeline.slice(0, idxInPipeline + 1).every((stage) => {
        return canRunStage(stage);
      });

    if (!canFetchPreviewForStage) {
      dispatch({
        type: StageEditorActionTypes.StagePreviewFetchSkipped,
        id: idx,
      });
      return;
    }

    try {
      dispatch({
        type: StageEditorActionTypes.StagePreviewFetch,
        id: idx,
      });

      const {
        namespace,
        maxTimeMS,
        collationString,
        limit,
        largeLimit,
        inputDocuments,
      } = getState();

      const options: PreviewOptions = {
        maxTimeMS: maxTimeMS ?? DEFAULT_MAX_TIME_MS,
        collation: collationString.value ?? undefined,
        sampleSize: largeLimit ?? DEFAULT_SAMPLE_SIZE,
        previewSize: limit ?? DEFAULT_PREVIEW_LIMIT,
        totalDocumentCount: inputDocuments.count,
      };

      const previewDocs = await pipelineBuilder.getPreviewForStage(
        idxInPipeline,
        namespace,
        options
      );
      dispatch({
        type: StageEditorActionTypes.StagePreviewFetchSuccess,
        id: idx,
        previewDocs,
      });
    } catch (err) {
      if (dataService.dataService?.isCancelError(err)) {
        return;
      }
      dispatch({
        type: StageEditorActionTypes.StagePreviewFetchError,
        id: idx,
        error: err as MongoServerError,
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
      .forEach(({ type }, id) => {
        if (type === 'stage') {
          void dispatch(loadStagePreview(from + id));
        }
      });
  };
};

export const runStage = (
  idx: number
): PipelineBuilderThunkAction<Promise<void>> => {
  return async (dispatch, getState, { pipelineBuilder }) => {
    const {
      id,
      dataService: { dataService },
      namespace,
      maxTimeMS,
      collationString,
      pipelineBuilder: {
        stageEditor: { stages },
      },
    } = getState();

    const pipelineFromStore = stages.filter(
      (stage): stage is ReduxStage => stage.type === 'stage'
    );
    const idxInPipeline = storeIndexToPipelineIndex(stages, idx);

    const stageInStore = pipelineFromStore[idx];

    if (
      !dataService ||
      stageInStore.type !== 'stage' ||
      stageInStore.disabled
    ) {
      return;
    }

    if (
      // Only run stage if all previous ones are valid (otherwise it will fail
      // anyway)
      !pipelineFromStore.slice(0, idxInPipeline + 1).every((stage) => {
        return canRunStage(stage, true);
      })
    ) {
      return;
    }

    try {
      dispatch({ type: StageEditorActionTypes.StageRun, id: idx });
      const pipeline = pipelineBuilder.getPipelineFromStages(
        pipelineBuilder.stages.slice(0, idxInPipeline + 1)
      );
      const options: AggregateOptions = {
        maxTimeMS: maxTimeMS ?? DEFAULT_MAX_TIME_MS,
        collation: collationString.value ?? undefined,
      };
      // We are not handling cancelling, just supporting `aggregatePipeline` interface
      const { signal } = new AbortController();
      const result = await aggregatePipeline({
        dataService,
        signal,
        namespace,
        pipeline,
        options,
      });
      dispatch({
        type: StageEditorActionTypes.StageRunSuccess,
        id: idx,
        previewDocs: result,
      });
      dispatch(globalAppRegistryEmit('agg-pipeline-out-executed', { id: idx }));
    } catch (error) {
      dispatch({ type: StageEditorActionTypes.StageRunError, id, error });
    }
  };
};

export const changeStageValue = (
  id: number,
  newVal: string
): PipelineBuilderThunkAction<void, ChangeStageValueAction> => {
  return (dispatch, getState, { pipelineBuilder }) => {
    const {
      pipelineBuilder: {
        stageEditor: { stages },
      },
    } = getState();
    const idxInPipeline = storeIndexToPipelineIndex(stages, id);

    const stage = pipelineBuilder.getStage(idxInPipeline);
    if (!stage) {
      return;
    }
    if (stage.value === newVal) {
      return;
    }
    stage.changeValue(newVal);
    dispatch({ type: StageEditorActionTypes.StageValueChange, id, stage });
    dispatch(loadPreviewForStagesFrom(id));
  };
};

const replaceOperatorSnippetTokens = (str: string): string => {
  const regex = /\${[0-9]+:?([a-z0-9.()]+)?}/gi;
  return str.replace(regex, function (_match, replaceWith) {
    return replaceWith ?? '';
  });
};

const ESCAPED_STAGE_OPERATORS = STAGE_OPERATORS.map((stage) => {
  return {
    ...stage,
    comment: replaceOperatorSnippetTokens(stage.comment),
    snippet: replaceOperatorSnippetTokens(stage.snippet),
  };
}) as unknown as typeof STAGE_OPERATORS;

function getStageSnippet(
  stageOperator: string | null,
  env: string,
  shouldAddComment: boolean,
  escaped = false
) {
  const stage = (escaped ? ESCAPED_STAGE_OPERATORS : STAGE_OPERATORS).find(
    (stageOp) => {
      return (
        stageOp.value === stageOperator &&
        (stageOp.env as readonly typeof ENVS[number][]).includes(
          env as typeof ENVS[number]
        )
      );
    }
  );

  if (!stage) {
    return `{}`;
  }

  return [shouldAddComment && stage.comment, stage.snippet ?? `{}`]
    .filter(Boolean)
    .join('');
}

export const changeStageOperator = (
  id: number,
  newVal: string
): PipelineBuilderThunkAction<
  string | undefined,
  ChangeStageOperatorAction
> => {
  return (dispatch, getState, { pipelineBuilder }) => {
    const {
      env,
      comments,
      pipelineBuilder: {
        stageEditor: { stages },
      },
    } = getState();

    const idxInPipeline = storeIndexToPipelineIndex(stages, id);

    const stage = pipelineBuilder.getStage(idxInPipeline);
    const stageInStore = stages[id];

    if (!stage || stageInStore.type !== 'stage') {
      return;
    }

    if (stage.operator === newVal) {
      return;
    }

    const currentSnippet = getStageSnippet(
      stageInStore.stageOperator,
      env,
      comments,
      // We're getting escaped snippet here because on insert to the editor, it
      // will replace anchors with their names (i.e., `${anchor}` will be
      // `anchor` when snippet is applied to the editor) and that's what we want
      // to compare to here
      true
    ).trim();

    const currentValue = stageInStore.value?.trim();

    stage.changeOperator(newVal);

    track('Aggregation Edited', {
      num_stages: stages.length,
      stage_action: 'stage_renamed',
      stage_name: stage.operator,
      stage_index: idxInPipeline + 1,
      editor_view_type: mapPipelineModeToEditorViewType(getState()),
    });

    dispatch({ type: StageEditorActionTypes.StageOperatorChange, id, stage });

    let newSnippet: string | undefined;

    // If there is no stage value or current stage value is identical to the
    // snippet for the current stage operator, then return a new snippet that
    // can be applied to the editor (this will be picked up by the UI and passed
    // the the editor to start snippet completion)
    if (!currentValue || currentSnippet === currentValue) {
      newSnippet = getStageSnippet(stage.operator, env, comments);
    }

    dispatch(loadPreviewForStagesFrom(id));

    return newSnippet;
  };
};

export const changeStageDisabled = (
  id: number,
  newVal: boolean
): PipelineBuilderThunkAction<void, ChangeStageDisabledAction> => {
  return (dispatch, getState, { pipelineBuilder }) => {
    const {
      pipelineBuilder: {
        stageEditor: { stages },
      },
    } = getState();
    const idxInPipeline = storeIndexToPipelineIndex(stages, id);

    const stage = pipelineBuilder.getStage(idxInPipeline);
    if (!stage) {
      return;
    }
    stage.changeDisabled(newVal);
    dispatch({
      type: StageEditorActionTypes.StageDisabledChange,
      id,
      disabled: newVal,
    });
    dispatch(loadPreviewForStagesFrom(id));
  };
};

export const changeStageCollapsed = (
  id: number,
  newVal: boolean
): ChangeStageCollapsedAction => {
  return {
    type: StageEditorActionTypes.StageCollapsedChange,
    id,
    collapsed: newVal,
  };
};

export const addStage = (
  after?: number
): PipelineBuilderThunkAction<void, StageAddAction> => {
  return (dispatch, getState, { pipelineBuilder }) => {
    const {
      pipelineBuilder: {
        stageEditor: { stages },
      },
    } = getState();
    const addAfter = after ?? stages.length;
    const addAfterIdxInPipeline = storeIndexToPipelineIndex(stages, addAfter, {
      includeIndex: true,
    });

    const stage = pipelineBuilder.addStage(addAfterIdxInPipeline);
    track('Aggregation Edited', {
      num_stages: getState().pipelineBuilder.stageEditor.stages.length,
      stage_action: 'stage_added',
      stage_index: stage.id + 1,
      editor_view_type: mapPipelineModeToEditorViewType(getState()),
    });
    dispatch({
      type: StageEditorActionTypes.StageAdded,
      after: addAfter,
      stage,
    });
  };
};

export const removeStage = (
  at: number
): PipelineBuilderThunkAction<void, StageRemoveAction> => {
  return (dispatch, getState, { pipelineBuilder }) => {
    const {
      pipelineBuilder: {
        stageEditor: { stages },
      },
    } = getState();
    const num_stages = stages.length;
    const atIdxInPipeline = storeIndexToPipelineIndex(stages, at, {
      includeIndex: true,
    });

    pipelineBuilder.cancelPreviewForStage(atIdxInPipeline);
    const stage = pipelineBuilder.removeStage(atIdxInPipeline);
    track('Aggregation Edited', {
      num_stages,
      stage_action: 'stage_deleted',
      stage_name: stage.operator,
      stage_index: at + 1,
      editor_view_type: mapPipelineModeToEditorViewType(getState()),
    });
    dispatch({ type: StageEditorActionTypes.StageRemoved, at });
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
    const {
      pipelineBuilder: {
        stageEditor: { stages },
      },
    } = getState();
    const fromIdxInPipeline = storeIndexToPipelineIndex(stages, from);
    const toIdxInPipeline = storeIndexToPipelineIndex(stages, to);
    const pipelineWasNotModified =
      stages[from].type === 'wizard' || fromIdxInPipeline === toIdxInPipeline;

    if (pipelineWasNotModified) {
      dispatch({ type: StageEditorActionTypes.StageMoved, from, to });
    } else {
      const pipeline = stages.filter(
        (stage): stage is ReduxStage => stage.type === 'stage'
      );

      track('Aggregation Edited', {
        num_stages: pipeline.length,
        stage_action: 'stage_reordered',
        stage_name: pipeline[fromIdxInPipeline].stageOperator,
        stage_index: fromIdxInPipeline + 1,
        editor_view_type: mapPipelineModeToEditorViewType(getState()),
      });

      pipelineBuilder.moveStage(fromIdxInPipeline, toIdxInPipeline);
      dispatch({ type: StageEditorActionTypes.StageMoved, from, to });
      dispatch(loadPreviewForStagesFrom(Math.min(from, to)));
    }
  };
};

export type AddWizardParams = Omit<WizardAddedAction, 'type' | 'after'> & {
  after?: number;
};

export const addWizard = (
  params: AddWizardParams
): PipelineBuilderThunkAction<void, WizardAddedAction> => {
  return (dispatch, getState) => {
    const {
      pipelineBuilder: {
        stageEditor: { stages },
      },
    } = getState();
    dispatch({
      ...params,
      type: StageEditorActionTypes.WizardAdded,
      after: params.after ?? stages.length,
    });
  };
};

export const removeWizard = (at: number): StageRemoveAction => ({
  type: StageEditorActionTypes.StageRemoved,
  at,
});

export type ReduxStage = {
  id: number;
  type: 'stage';
  stageOperator: string | null;
  value: string | null;
  syntaxError: PipelineParserError | null;
  serverError: MongoServerError | null;
  loading: boolean;
  previewDocs: Document[] | null;
  collapsed: boolean;
  disabled: boolean;
  empty: boolean;
};

export type Wizard = {
  id: number;
  type: 'wizard';
  usecaseId: number;
  formValues: unknown;
};

export type StageEditorState = {
  stageIds: number[];
  stages: (ReduxStage | Wizard)[];
};

export function mapBuilderStageToStoreStage(stage: Stage): ReduxStage {
  return {
    id: stage.id,
    type: 'stage',
    stageOperator: stage.operator,
    value: stage.value,
    syntaxError: stage.syntaxError,
    disabled: stage.disabled,
    serverError: null,
    loading: false,
    previewDocs: null,
    collapsed: false,
    empty: stage.isEmpty,
  };
}

const reducer: Reducer<StageEditorState> = (
  state = { stageIds: [], stages: [] },
  action
) => {
  if (
    action.type === RESTORE_PIPELINE ||
    action.type === ConfirmNewPipelineActions.NewPipelineConfirmed ||
    isAction<PipelineModeToggledAction>(
      action,
      PipelineModeActionTypes.PipelineModeToggled
    )
  ) {
    const stages = action.stages.map((stage: Stage) => {
      return mapBuilderStageToStoreStage(stage);
    });
    return {
      stageIds: stages.map((stage: Stage) => stage.id),
      stages,
    };
  }

  if (
    isAction<StagePreviewFetchAction>(
      action,
      StageEditorActionTypes.StagePreviewFetch
    ) ||
    isAction<StageRunAction>(action, StageEditorActionTypes.StageRun)
  ) {
    return {
      ...state,
      stages: [
        ...state.stages.slice(0, action.id),
        {
          ...state.stages[action.id],
          serverError: null,
          loading: true,
        },
        ...state.stages.slice(action.id + 1),
      ],
    };
  }

  if (
    isAction<StagePreviewFetchSkippedAction>(
      action,
      StageEditorActionTypes.StagePreviewFetchSkipped
    )
  ) {
    return {
      ...state,
      stages: [
        ...state.stages.slice(0, action.id),
        {
          ...state.stages[action.id],
          loading: false,
          previewDocs: null,
          serverError: null,
        },
        ...state.stages.slice(action.id + 1),
      ],
    };
  }

  if (
    isAction<StagePreviewFetchSuccessAction>(
      action,
      StageEditorActionTypes.StagePreviewFetchSuccess
    ) ||
    isAction<StageRunSuccessAction>(
      action,
      StageEditorActionTypes.StageRunSuccess
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
          serverError: null,
        },
        ...state.stages.slice(action.id + 1),
      ],
    };
  }

  if (
    isAction<StagePreviewFetchErrorAction>(
      action,
      StageEditorActionTypes.StagePreviewFetchError
    ) ||
    isAction<StageRunErrorAction>(action, StageEditorActionTypes.StageRunError)
  ) {
    return {
      ...state,
      stages: [
        ...state.stages.slice(0, action.id),
        {
          ...state.stages[action.id],
          loading: false,
          serverError: action.error,
        },
        ...state.stages.slice(action.id + 1),
      ],
    };
  }

  if (
    isAction<ChangeStageValueAction>(
      action,
      StageEditorActionTypes.StageValueChange
    )
  ) {
    return {
      ...state,
      stages: [
        ...state.stages.slice(0, action.id),
        {
          ...state.stages[action.id],
          previewDocs: null,
          value: action.stage.value,
          syntaxError: action.stage.syntaxError,
          empty: action.stage.isEmpty,
        },
        ...state.stages.slice(action.id + 1),
      ],
    };
  }

  if (
    isAction<ChangeStageOperatorAction>(
      action,
      StageEditorActionTypes.StageOperatorChange
    )
  ) {
    return {
      ...state,
      stages: [
        ...state.stages.slice(0, action.id),
        {
          ...state.stages[action.id],
          previewDocs: null,
          stageOperator: action.stage.operator,
          syntaxError: action.stage.syntaxError,
          empty: action.stage.isEmpty,
        },
        ...state.stages.slice(action.id + 1),
      ],
    };
  }

  if (
    isAction<ChangeStageDisabledAction>(
      action,
      StageEditorActionTypes.StageDisabledChange
    )
  ) {
    return {
      ...state,
      stages: [
        ...state.stages.slice(0, action.id),
        {
          ...state.stages[action.id],
          serverError: null,
          previewDocs: null,
          disabled: action.disabled,
        },
        ...state.stages.slice(action.id + 1),
      ],
    };
  }

  if (
    isAction<ChangeStageCollapsedAction>(
      action,
      StageEditorActionTypes.StageCollapsedChange
    )
  ) {
    return {
      ...state,
      stages: [
        ...state.stages.slice(0, action.id),
        {
          ...state.stages[action.id],
          collapsed: action.collapsed,
        },
        ...state.stages.slice(action.id + 1),
      ],
    };
  }

  if (isAction<StageAddAction>(action, StageEditorActionTypes.StageAdded)) {
    const after = action.after ?? state.stages.length;
    const stages = [...state.stages];
    stages.splice(after + 1, 0, mapBuilderStageToStoreStage(action.stage));
    return {
      ...state,
      stageIds: stages.map((stage) => stage.id),
      stages,
    };
  }

  if (
    isAction<StageRemoveAction>(action, StageEditorActionTypes.StageRemoved)
  ) {
    const stages = [...state.stages];
    stages.splice(action.at, 1);
    return {
      ...state,
      stageIds: stages.map((stage) => stage.id),
      stages,
    };
  }

  if (isAction<StageMoveAction>(action, StageEditorActionTypes.StageMoved)) {
    const stages = [...state.stages];
    const movedStage = stages.splice(action.from, 1)[0];
    stages.splice(action.to, 0, movedStage);
    return {
      ...state,
      stageIds: stages.map((stage) => stage.id),
      stages,
    };
  }

  if (isAction<WizardAddedAction>(action, StageEditorActionTypes.WizardAdded)) {
    const { after, usecaseId, formValues } = action;
    const stages = [...state.stages];
    stages.splice(after + 1, 0, {
      id: getId(),
      type: 'wizard',
      usecaseId,
      formValues,
    });

    return {
      ...state,
      stages,
      stageIds: stages.map((stage) => stage.id),
    };
  }

  return state;
};

export default reducer;
