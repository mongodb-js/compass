import type { Action, Reducer } from 'redux';
import HadronDocument from 'hadron-document';
import type { AggregateOptions, MongoServerError } from 'mongodb';
import { prettify } from '@mongodb-js/compass-editor';
import type { RestorePipelineAction } from '../saved-pipeline';
import { RESTORE_PIPELINE } from '../saved-pipeline';
import type { PipelineBuilderThunkAction } from '../';
import { isAction } from '../../utils/is-action';
import type Stage from './stage';
import type { NewPipelineConfirmedAction } from '../is-new-pipeline-confirm';
import { ActionTypes as ConfirmNewPipelineActions } from '../is-new-pipeline-confirm';
import { STAGE_OPERATORS } from '@mongodb-js/mongodb-constants';
import { DEFAULT_MAX_TIME_MS } from '../../constants';
import type { PreviewOptions } from './pipeline-preview-manager';
import {
  DEFAULT_PREVIEW_LIMIT,
  DEFAULT_SAMPLE_SIZE,
} from './pipeline-preview-manager';
import { aggregatePipeline } from '../../utils/cancellable-aggregation';
import type { PipelineParserError } from './pipeline-parser/utils';
import { parseShellBSON } from './pipeline-parser/utils';
import { ActionTypes as PipelineModeActionTypes } from './pipeline-mode';
import type { PipelineModeToggledAction } from './pipeline-mode';
import {
  getDestinationNamespaceFromStage,
  isOutputStage,
} from '../../utils/stage';
import { mapPipelineModeToEditorViewType } from './builder-helpers';
import { getId } from './stage-ids';
import { fetchExplainForPipeline } from '../insights';
import { AIPipelineActionTypes } from './pipeline-ai';
import type { ServerEnvironment } from './../env';
import type {
  LoadGeneratedPipelineAction,
  PipelineGeneratedFromQueryAction,
} from './pipeline-ai';

export const enum StageEditorActionTypes {
  StagePreviewFetch = 'compass-aggregations/pipeline-builder/stage-editor/StagePreviewFetch',
  StagePreviewFetchSkipped = 'compass-aggregations/pipeline-builder/stage-editor/StagePreviewFetchSkipped',
  StagePreviewFetchSuccess = 'compass-aggregations/pipeline-builder/stage-editor/StagePreviewFetchSuccess',
  StagePreviewFetchError = 'compass-aggregations/pipeline-builder/stage-editor/StagePreviewFetchError',
  StageRun = 'compass-aggregations/pipeline-builder/stage-editor/StageRun',
  StageRunSuccess = 'compass-aggregations/pipeline-builder/stage-editor/StageRunSuccess',
  StageRunError = 'compass-aggregations/pipeline-builder/stage-editor/StageRunError',
  StageValueChange = 'compass-aggregations/pipeline-builder/stage-editor/StageValueChange',
  StageOperatorChange = 'compass-aggregations/pipeline-builder/stage-editor/StageOperatorChange',
  StageCollapsedChange = 'compass-aggregations/pipeline-builder/stage-editor/StageCollapsedChange',
  StageDisabledChange = 'compass-aggregations/pipeline-builder/stage-editor/StageDisabledChange',
  StageAdded = 'compass-aggregations/pipeline-builder/stage-editor/StageAdded',
  StageRemoved = 'compass-aggregations/pipeline-builder/stage-editor/StageRemoved',
  StageMoved = 'compass-aggregations/pipeline-builder/stage-editor/StageMoved',
  WizardAdded = 'compass-aggregations/pipeline-builder/stage-wizard/WizardAdded',
  WizardRemoved = 'compass-aggregations/pipeline-builder/stage-wizard/WizardRemoved',
  WizardChanged = 'compass-aggregations/pipeline-builder/stage-wizard/WizardChanged',
  WizardToStageClicked = 'compass-aggregations/pipeline-builder/stage-wizard/wizardToStageClicked',
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
  previewDocs: HadronDocument[];
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
  previewDocs: HadronDocument[];
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
  stage: StoreStage;
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

type WizardAddAction = {
  type: StageEditorActionTypes.WizardAdded;
  wizard: Wizard;
  after: number;
};

type WizardRemoveAction = {
  type: StageEditorActionTypes.WizardRemoved;
  at: number;
};

type WizardChangeAction = {
  type: StageEditorActionTypes.WizardChanged;
  at: number;
  value: string | null;
  syntaxError: SyntaxError | null;
};

type WizardToStageAction = {
  type: StageEditorActionTypes.WizardToStageClicked;
  at: number;
  stage: StoreStage;
};

export type StageEditorAction =
  | StagePreviewFetchAction
  | StagePreviewFetchSkippedAction
  | StagePreviewFetchSuccessAction
  | StagePreviewFetchErrorAction
  | StageRunAction
  | StageRunSuccessAction
  | StageRunErrorAction
  | ChangeStageValueAction
  | ChangeStageOperatorAction
  | ChangeStageCollapsedAction
  | ChangeStageDisabledAction
  | StageAddAction
  | StageRemoveAction
  | StageMoveAction
  | WizardAddAction
  | WizardRemoveAction
  | WizardChangeAction
  | WizardToStageAction;

export function storeIndexToPipelineIndex(
  stages: StageEditorState['stages'],
  indexInStore: number,
  { includeIndex } = { includeIndex: false }
): number {
  const endBound = includeIndex ? indexInStore + 1 : indexInStore;
  const considerableStages = stages.slice(0, endBound);
  const totalWizards = wizardsFromStore(considerableStages);
  return indexInStore - totalWizards.length;
}

export function pipelineFromStore(
  stages: StageEditorState['stages']
): StoreStage[] {
  return stages.filter((stage): stage is StoreStage => stage.type === 'stage');
}

export function wizardsFromStore(stages: StageEditorState['stages']): Wizard[] {
  return stages.filter((stage): stage is Wizard => stage.type === 'wizard');
}

function remapPipelineStageIndexesInStore() {
  let totalWizardsEncountered = 0;
  return function (
    stage: StageEditorState['stages'][number],
    idx: number
  ): StageEditorState['stages'][number] {
    if (stage.type === 'wizard') {
      totalWizardsEncountered += 1;
      return stage;
    } else {
      return {
        ...stage,
        idxInPipeline: idx - totalWizardsEncountered,
      };
    }
  };
}

function canRunStage(stage?: StoreStage, allowOut = false): boolean {
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

    const stage = stages[idx];
    if (!stage || stage.type !== 'stage') {
      return;
    }

    const { idxInPipeline } = stage;
    // Ignoring the state of the stage, always try to stop current preview fetch
    pipelineBuilder.cancelPreviewForStage(idxInPipeline);

    const canFetchPreviewForStage =
      autoPreview &&
      !stage.disabled &&
      // Only run stage if all previous ones are valid (otherwise it will fail
      // anyway)
      pipelineFromStore(stages.slice(0, idx + 1)).every((stage) =>
        canRunStage(stage)
      );

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
        collectionStats,
      } = getState();

      const options: PreviewOptions = {
        maxTimeMS: maxTimeMS ?? DEFAULT_MAX_TIME_MS,
        collation: collationString.value ?? undefined,
        sampleSize: largeLimit ?? DEFAULT_SAMPLE_SIZE,
        previewSize: limit ?? DEFAULT_PREVIEW_LIMIT,
        totalDocumentCount: collectionStats?.document_count,
      };

      const previewDocs = await pipelineBuilder.getPreviewForStage(
        idxInPipeline,
        namespace,
        options
      );
      dispatch({
        type: StageEditorActionTypes.StagePreviewFetchSuccess,
        id: idx,
        previewDocs: previewDocs.map((doc) => new HadronDocument(doc)),
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

export const expandPreviewDocsForStage = (
  stageIdx: number
): PipelineBuilderThunkAction<void> => {
  return (dispatch, getState) => {
    const {
      inputDocuments: { documents: inputDocuments },
      pipelineBuilder: {
        stageEditor: { stages },
      },
    } = getState();

    if (stageIdx === -1) {
      inputDocuments.forEach((doc) => doc.expand());
      return;
    }

    const stage = stages[stageIdx];
    if (!stage || stage.type !== 'stage') {
      return;
    }

    stage.previewDocs?.forEach((doc) => doc.expand());
  };
};

export const collapsePreviewDocsForStage = (
  stageIdx: number
): PipelineBuilderThunkAction<void> => {
  return (dispatch, getState) => {
    const {
      inputDocuments: { documents: inputDocuments },
      pipelineBuilder: {
        stageEditor: { stages },
      },
    } = getState();

    if (stageIdx === -1) {
      inputDocuments.forEach((doc) => doc.collapse());
      return;
    }

    const stage = stages[stageIdx];
    if (!stage || stage.type !== 'stage') {
      return;
    }

    stage.previewDocs?.forEach((doc) => doc.collapse());
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

export const runStage = (
  idx: number
): PipelineBuilderThunkAction<Promise<void>> => {
  return async (
    dispatch,
    getState,
    { pipelineBuilder, preferences, connectionScopedAppRegistry }
  ) => {
    const {
      dataService: { dataService },
      namespace,
      maxTimeMS,
      collationString,
      pipelineBuilder: {
        stageEditor: { stages },
      },
    } = getState();

    const stage = stages[idx];
    if (
      !dataService ||
      !stage ||
      stage.type !== 'stage' ||
      stage.disabled ||
      // Only run stage if all previous ones are valid (otherwise it will fail
      // anyway)
      !pipelineFromStore(stages.slice(0, idx + 1)).every((stage) =>
        canRunStage(stage, true)
      )
    ) {
      return;
    }

    const { idxInPipeline } = stage;

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
        preferences,
        signal,
        namespace,
        pipeline,
        options,
      });
      dispatch({
        type: StageEditorActionTypes.StageRunSuccess,
        id: idx,
        previewDocs: result.map((doc) => new HadronDocument(doc)),
      });
      connectionScopedAppRegistry.emit(
        'agg-pipeline-out-executed',
        getDestinationNamespaceFromStage(
          namespace,
          pipeline[pipeline.length - 1]
        )
      );
    } catch (error: any) {
      dispatch({
        type: StageEditorActionTypes.StageRunError,
        id: idx,
        error,
      });
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

    const stageInStore = stages[id];
    if (!stageInStore || stageInStore.type !== 'stage') {
      return;
    }

    const { idxInPipeline } = stageInStore;
    const stage = pipelineBuilder.getStage(idxInPipeline);
    if (!stage || stage.value === newVal) {
      return;
    }

    stage.changeValue(newVal);
    dispatch({ type: StageEditorActionTypes.StageValueChange, id, stage });
    dispatch(loadPreviewForStagesFrom(id));
    void dispatch(fetchExplainForPipeline());
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
  env: ServerEnvironment,
  shouldAddComment: boolean,
  escaped = false
) {
  const stages = (escaped ? ESCAPED_STAGE_OPERATORS : STAGE_OPERATORS).filter(
    (stageOp) => stageOp.value === stageOperator
  );

  const stage =
    stages.find((stageOp) =>
      (stageOp.env as readonly ServerEnvironment[]).includes(env)
    ) ?? stages[0];

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
  return (
    dispatch,
    getState,
    { pipelineBuilder, track, connectionInfoRef }
  ) => {
    const {
      env,
      comments,
      pipelineBuilder: {
        stageEditor: { stages },
      },
    } = getState();

    const stageInStore = stages[id];
    if (!stageInStore || stageInStore.type !== 'stage') {
      return;
    }

    const { idxInPipeline } = stageInStore;
    const stage = pipelineBuilder.getStage(idxInPipeline);
    if (!stage || stage.operator === newVal) {
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

    track(
      'Aggregation Edited',
      {
        num_stages: pipelineFromStore(stages).length,
        stage_action: 'stage_renamed',
        stage_name: stage.operator,
        stage_index: idxInPipeline + 1,
        editor_view_type: mapPipelineModeToEditorViewType(getState()),
      },
      connectionInfoRef.current
    );

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
    void dispatch(fetchExplainForPipeline());

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

    const stageInStore = stages[id];
    if (!stageInStore || stageInStore.type !== 'stage') {
      return;
    }

    const { idxInPipeline } = stageInStore;
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
    void dispatch(fetchExplainForPipeline());
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
  return (
    dispatch,
    getState,
    { pipelineBuilder, track, connectionInfoRef }
  ) => {
    const {
      pipelineBuilder: {
        stageEditor: { stages },
      },
    } = getState();
    const addAfter = after ?? stages.length;
    const addAfterIdxInPipeline = storeIndexToPipelineIndex(stages, addAfter, {
      // The item at afterIndex could be a wizard hence we need to consider
      // that while calculating the corresponding afterIdx in pipeline
      includeIndex: true,
    });

    const stage = pipelineBuilder.addStage(addAfterIdxInPipeline);
    track(
      'Aggregation Edited',
      {
        num_stages: pipelineFromStore(stages).length,
        stage_action: 'stage_added',
        stage_index: stage.id + 1,
        editor_view_type: mapPipelineModeToEditorViewType(getState()),
      },
      connectionInfoRef.current
    );
    dispatch({
      type: StageEditorActionTypes.StageAdded,
      after: addAfter,
      stage: mapBuilderStageToStoreStage(stage, addAfterIdxInPipeline),
    });
  };
};

export const removeStage = (
  at: number
): PipelineBuilderThunkAction<void, StageRemoveAction> => {
  return (
    dispatch,
    getState,
    { pipelineBuilder, track, connectionInfoRef }
  ) => {
    const {
      pipelineBuilder: {
        stageEditor: { stages },
      },
    } = getState();
    const stageInStore = stages[at];
    if (!stageInStore || stageInStore.type !== 'stage') {
      return;
    }

    const { idxInPipeline } = stageInStore;

    pipelineBuilder.cancelPreviewForStage(idxInPipeline);
    const stage = pipelineBuilder.removeStage(idxInPipeline);
    track(
      'Aggregation Edited',
      {
        num_stages: pipelineFromStore(stages).length,
        stage_action: 'stage_deleted',
        stage_name: stage.operator,
        stage_index: idxInPipeline + 1,
        editor_view_type: mapPipelineModeToEditorViewType(getState()),
      },
      connectionInfoRef.current
    );
    dispatch({ type: StageEditorActionTypes.StageRemoved, at });
    dispatch(loadPreviewForStagesFrom(at));
    void dispatch(fetchExplainForPipeline());
  };
};

export const moveStage = (
  from: number,
  to: number
): PipelineBuilderThunkAction<void, StageMoveAction> => {
  return (
    dispatch,
    getState,
    { pipelineBuilder, track, connectionInfoRef }
  ) => {
    if (from === to) {
      return;
    }
    const {
      pipelineBuilder: {
        stageEditor: { stages },
      },
    } = getState();

    const stageAtFromIdx = stages[from];
    const stageAtToIdx = stages[to];

    const toIdxInPipeline =
      stageAtToIdx.type === 'stage'
        ? stageAtToIdx.idxInPipeline
        : // storeIndexToPipelineIndex calculates the pipeline index in reference
          // to the start of the list. When a stage is being moved from the front
          // of the list towards the back then the list is shifted to the left by 1
          // and thus there is one additional item to be considered when we
          // calculate the pipeline index corresponding to the provided index.
          storeIndexToPipelineIndex(stages, to, { includeIndex: from < to });

    const pipelineWasNotModified =
      // This stage being moved is a wizard and moving it will not incur any
      // change in actual pipeline
      stageAtFromIdx.type === 'wizard' ||
      // Although the "stage" moved but it did not jump any other stages,
      // just the wizards which is why the resulting toIdxInPipeline is
      // same as the fromIdxInPipeline and hence no change in actual pipeline
      // ever happened.
      stageAtFromIdx.idxInPipeline === toIdxInPipeline;

    if (pipelineWasNotModified) {
      dispatch({ type: StageEditorActionTypes.StageMoved, from, to });
    } else {
      track(
        'Aggregation Edited',
        {
          num_stages: pipelineFromStore(stages).length,
          stage_action: 'stage_reordered',
          stage_name: stageAtFromIdx.stageOperator,
          stage_index: stageAtFromIdx.idxInPipeline + 1,
          editor_view_type: mapPipelineModeToEditorViewType(getState()),
        },
        connectionInfoRef.current
      );

      pipelineBuilder.moveStage(stageAtFromIdx.idxInPipeline, toIdxInPipeline);
      dispatch({ type: StageEditorActionTypes.StageMoved, from, to });
      dispatch(loadPreviewForStagesFrom(Math.min(from, to)));
      void dispatch(fetchExplainForPipeline());
    }
  };
};

export type AddWizardParams = {
  usecaseId: number;
  formValues: unknown;
  after?: number;
};

export const addWizard = (
  useCaseId: string,
  stageOperator: string,
  after?: number
): PipelineBuilderThunkAction<void, WizardAddAction> => {
  return (dispatch, getState) => {
    const {
      pipelineBuilder: {
        stageEditor: { stages },
      },
    } = getState();

    const wizard: Wizard = {
      id: getId(),
      type: 'wizard',
      useCaseId,
      stageOperator,
      value: null,
      syntaxError: null,
    };

    dispatch({
      wizard,
      type: StageEditorActionTypes.WizardAdded,
      after: after ?? stages.length,
    });
  };
};

export const removeWizard = (at: number): WizardRemoveAction => ({
  type: StageEditorActionTypes.WizardRemoved,
  at,
});

export const updateWizardValue = (
  at: number,
  value: string
): PipelineBuilderThunkAction<void, WizardChangeAction> => {
  return (dispatch, getState) => {
    const {
      pipelineBuilder: {
        stageEditor: { stages },
      },
    } = getState();
    const itemAtIdx = stages[at];
    if (itemAtIdx.type !== 'wizard') {
      return;
    }

    try {
      parseShellBSON(value);
      dispatch({
        type: StageEditorActionTypes.WizardChanged,
        at,
        value,
        syntaxError: null,
      });
    } catch (e) {
      dispatch({
        type: StageEditorActionTypes.WizardChanged,
        at,
        value,
        syntaxError: e as SyntaxError,
      });
    }
  };
};

const formatWizardValue = (value?: string): string => {
  if (!value) {
    return '';
  }

  // Each wizard forms are currently in charge of building and providing the stage content as
  // a string, however they are not also completely formatting them.
  //
  // In order to centralize the prettification and indentation of the
  // code produced, without making too many assumptions on the content
  // we first try to re-parse them as JSON to properly indent the code, and then
  // we attempt to prettify, giving up on malformed strings, to
  // allow wizards create arbitrary strings.
  //
  // NOTE: this is a good candidate for refactor unless we are going to really take advantage of
  // this relaxed contract between the forms and the rest of the code based on strings,
  // we would rather benefit from more clear types and being able to make assumptions
  // on the structure of generated stages.

  let reIndented = value;
  try {
    reIndented = JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    // not valid json
  }

  try {
    return prettify(reIndented);
  } catch {
    // not valid js (ie. the generated stage has placeholders for the user to fill etc ..)
    return reIndented;
  }
};

export const convertWizardToStage = (
  at: number
): PipelineBuilderThunkAction<
  void,
  WizardChangeAction | WizardToStageAction
> => {
  return (
    dispatch,
    getState,
    { pipelineBuilder, track, connectionInfoRef }
  ) => {
    const {
      pipelineBuilder: {
        stageEditor: { stages },
      },
    } = getState();
    const itemAtIdx = stages[at];
    if (itemAtIdx.type !== 'wizard') {
      return;
    }

    const isInvalid = itemAtIdx.syntaxError || !itemAtIdx.value;
    if (isInvalid) {
      const error =
        itemAtIdx.syntaxError ||
        new SyntaxError('Cannot convert empty wizard to stage');
      dispatch({
        type: StageEditorActionTypes.WizardChanged,
        at,
        value: itemAtIdx.value,
        syntaxError: error,
      });
      return;
    }

    const afterStageIndex = storeIndexToPipelineIndex(stages, at);
    const stage = pipelineBuilder.addStage(afterStageIndex);
    stage.changeOperator(itemAtIdx.stageOperator);

    stage.changeValue(formatWizardValue(itemAtIdx.value as string));

    const connectionInfo = connectionInfoRef.current;
    track(
      'Aggregation Edited',
      {
        num_stages: pipelineFromStore(stages).length + 1,
        stage_action: 'stage_added',
        stage_name: stage.operator,
        stage_index: afterStageIndex + 1,
        editor_view_type: 'stage',
      },
      connectionInfo
    );
    track(
      'Aggregation Use Case Saved',
      {
        stage_name: stage.operator,
      },
      connectionInfo
    );

    dispatch({
      type: StageEditorActionTypes.WizardToStageClicked,
      at,
      stage: mapBuilderStageToStoreStage(stage, afterStageIndex),
    });

    dispatch(loadPreviewForStagesFrom(at));
    void dispatch(fetchExplainForPipeline());
  };
};

export type StoreStage = {
  id: number;
  idxInPipeline: number;
  type: 'stage';
  stageOperator: string | null;
  value: string | null;
  syntaxError: PipelineParserError | null;
  serverError: MongoServerError | null;
  loading: boolean;
  previewDocs: HadronDocument[] | null;
  collapsed: boolean;
  disabled: boolean;
  empty: boolean;
};

export type Wizard = {
  id: number;
  type: 'wizard';
  useCaseId: string;
  stageOperator: string;
  value: string | null;
  syntaxError: SyntaxError | null;
};

export type StageIdAndType = { id: number; type: 'stage' | 'wizard' };

export type StageEditorState = {
  stagesIdAndType: StageIdAndType[];
  stages: (StoreStage | Wizard)[];
};

export function mapBuilderStageToStoreStage(
  stage: Stage,
  idxInPipeline: number
): StoreStage {
  return {
    id: stage.id,
    idxInPipeline,
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

export function mapStoreStagesToStageIdAndType(
  stages: Pick<StageEditorState['stages'][number], 'id' | 'type'>[]
): Array<{ id: number; type: 'stage' | 'wizard' }> {
  return stages.map(({ id, type }) => ({ id, type }));
}

const reducer: Reducer<StageEditorState, Action> = (
  state: StageEditorState = { stagesIdAndType: [], stages: [] },
  action
) => {
  if (
    isAction<RestorePipelineAction>(action, RESTORE_PIPELINE) ||
    isAction<NewPipelineConfirmedAction>(
      action,
      ConfirmNewPipelineActions.NewPipelineConfirmed
    ) ||
    isAction<PipelineModeToggledAction>(
      action,
      PipelineModeActionTypes.PipelineModeToggled
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
    const stages = action.stages.map((stage: Stage, idx: number) => {
      return mapBuilderStageToStoreStage(stage, idx);
    });
    return {
      stagesIdAndType: mapStoreStagesToStageIdAndType(stages),
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
        } as StoreStage,
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
    const after = action.after;
    const stages = [...state.stages];
    stages.splice(after + 1, 0, action.stage);

    return {
      ...state,
      stagesIdAndType: mapStoreStagesToStageIdAndType(stages),
      stages: stages.map(remapPipelineStageIndexesInStore()),
    };
  }

  if (
    isAction<StageRemoveAction>(action, StageEditorActionTypes.StageRemoved) ||
    isAction<WizardRemoveAction>(action, StageEditorActionTypes.WizardRemoved)
  ) {
    const stages = [...state.stages];
    stages.splice(action.at, 1);
    return {
      ...state,
      stagesIdAndType: mapStoreStagesToStageIdAndType(stages),
      stages: stages.map(remapPipelineStageIndexesInStore()),
    };
  }

  if (isAction<StageMoveAction>(action, StageEditorActionTypes.StageMoved)) {
    const stages = [...state.stages];
    const movedStage = stages.splice(action.from, 1)[0];
    stages.splice(action.to, 0, movedStage);
    return {
      ...state,
      stagesIdAndType: mapStoreStagesToStageIdAndType(stages),
      stages: stages.map(remapPipelineStageIndexesInStore()),
    };
  }

  if (isAction<WizardAddAction>(action, StageEditorActionTypes.WizardAdded)) {
    const { after, wizard } = action;
    const stages = [...state.stages];
    stages.splice(after + 1, 0, wizard);

    return {
      ...state,
      stages,
      stagesIdAndType: mapStoreStagesToStageIdAndType(stages),
    };
  }

  if (
    isAction<WizardChangeAction>(action, StageEditorActionTypes.WizardChanged)
  ) {
    const { at, value, syntaxError } = action;
    const stages = [
      ...state.stages.slice(0, at),
      {
        ...state.stages[at],
        value,
        syntaxError,
      },
      ...state.stages.slice(at + 1),
    ];

    return {
      ...state,
      stages,
    };
  }

  if (
    isAction<WizardToStageAction>(
      action,
      StageEditorActionTypes.WizardToStageClicked
    )
  ) {
    const at = action.at;
    const stages = [...state.stages];
    stages.splice(at, 1, action.stage);

    return {
      ...state,
      stagesIdAndType: mapStoreStagesToStageIdAndType(stages),
      stages: stages.map(remapPipelineStageIndexesInStore()),
    };
  }

  return state;
};

export default reducer;
