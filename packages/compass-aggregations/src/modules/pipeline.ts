import type { ENVS } from '@mongodb-js/mongodb-constants';
import { ADL, ATLAS, STAGE_OPERATORS } from '@mongodb-js/mongodb-constants';
import { generateStage, generateStageAsString, validateStage } from './stage';
import { globalAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';
import { emptyStage } from '../utils/stage';
import toNS from 'mongodb-ns';
import decomment from 'decomment';
import type { AnyAction } from 'redux';
import { mapPipelineToStages, parseNamespace } from '../utils/stage';
import { createId } from './id';
import {
  DEFAULT_MAX_TIME_MS,
  DEFAULT_SAMPLE_SIZE,
  DEFAULT_LARGE_LIMIT
} from '../constants';
import type { PipelineBuilderThunkAction, RootState } from '.';
import type { AggregateOptions, Document } from 'mongodb';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { projectionsChanged, PROJECTIONS_CHANGED } from './projections';
import { setIsModified } from './is-modified';
import type { AutoPreviewToggledAction } from './auto-preview';
import { ActionTypes as AutoPreviewActionTypes } from './auto-preview';
import { CONFIRM_NEW, NEW_PIPELINE } from './import-pipeline';
import { RESTORE_PIPELINE } from './saved-pipeline';
import { isCancelError } from '../utils/cancellable-promise';

const { track } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

export type Projection = {
  name: string;
  value: string;
  score: number;
  meta: string;
  version: string;
  index?: number;
};

export type StageState = {
  id: string;
  stageOperator: string;
  stage: string;
  isValid: boolean;
  isEnabled: boolean;
  isExpanded: boolean;
  isLoading: boolean;
  isComplete: boolean;
  previewDocuments: Document[];
  syntaxError: string | null;
  error: string | null;
  projections: Projection[];
  isMissingAtlasOnlyStageSupport?: boolean;
  executor?: Record<string, unknown>;
};

/**
 * Action name prefix.
 */
const PREFIX = 'aggregations/pipeline';

/**
 * Stage added action name.
 */
export const STAGE_ADDED = `${PREFIX}/STAGE_ADDED`;

/**
 * Stage added after action name.
 */
export const STAGE_ADDED_AFTER = `${PREFIX}/STAGE_ADDED_AFTER`;

/**
 * Stage changed action name.
 */
export const STAGE_CHANGED = `${PREFIX}/STAGE_CHANGED`;

/**
 * Stage collapse toggled action name.
 */
export const STAGE_COLLAPSE_TOGGLED = `${PREFIX}/STAGE_COLLAPSE_TOGGLED`;

/**
 * Stage deleted action name.
 */
export const STAGE_DELETED = `${PREFIX}/STAGE_DELETED`;

/**
 * Stage moved action name.
 */
export const STAGE_MOVED = `${PREFIX}/STAGE_MOVED`;

/**
 * Stage operator selected action name.
 */
export const STAGE_OPERATOR_SELECTED = `${PREFIX}/STAGE_OPERATOR_SELECTED`;

/**
 * Stage toggled action name.
 */
export const STAGE_TOGGLED = `${PREFIX}/STAGE_TOGGLED`;

/**
 * Stage preview updated action name.
 */
export const STAGE_PREVIEW_UPDATED = `${PREFIX}/STAGE_PREVIEW_UPDATED`;

/**
 * Loading stage results action name.
 */
export const LOADING_STAGE_RESULTS = `${PREFIX}/LOADING_STAGE_RESULTS`;

/**
 * Clear the pipeline name.
 */
export const CLEAR_PIPELINE = 'aggregations/CLEAR_PIPELINE';

/**
 * Limit constant.
 */
export const LIMIT = Object.freeze({ $limit: DEFAULT_SAMPLE_SIZE });

/**
 * Large limit constant.
 */
export const LARGE_LIMIT = Object.freeze({ $limit: DEFAULT_LARGE_LIMIT });

/**
 * Stage operators that are required to be the first stage.
 */
export const REQUIRED_AS_FIRST_STAGE = [
  '$collStats',
  '$currentOp',
  '$indexStats',
  '$listLocalSessions',
  '$listSessions'
];

/**
 * Ops that must scan the entire results before moving to the
 * next stage.
 */
export const FULL_SCAN_OPS = ['$group', '$bucket', '$bucketAuto'];

/**
 * The out stage operator.
 */
export const OUT = '$out';

/**
 * The merge stage operator.
 */
export const MERGE = '$merge';

/**
 * The search stage operator.
 */
export const SEARCH = '$search';

/**
 * The searchMeta stage operator.
 */
export const SEARCH_META = '$searchMeta';

/**
 * The documents stage operator.
 */
export const DOCUMENTS = '$documents';

export type State = StageState[];

/**
 * The initial state.
 */
export const INITIAL_STATE: State = [emptyStage()];

/**
 * The default snippet.
 */
const DEFAULT_SNIPPET = '{\n  \n}';

/**
 * Copy the state.
 *
 * @param {Array} state - The current state.
 *
 * @returns {Array} The copied state.
 */
const copyState = (state: State): State =>
  state.map((s) => Object.assign({}, s));

/**
 * Get a stage operator details from the provided operator name.
 *
 * @param {String} name - The stage operator name.
 * @param {String} env - The environment.
 *
 * @returns {Object} The stage operator details.
 */
const getStageOperator = (
  name: string,
  env: typeof ENVS[number]
): typeof STAGE_OPERATORS[number] | undefined => {
  return STAGE_OPERATORS.find((op) => {
    return (
      op.name === name &&
      (op.env as readonly typeof ENVS[number][]).includes(env)
    );
  });
};

/**
 * Change stage value.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const changeStage = (state: State, action: AnyAction): State => {
  const newState = copyState(state);
  newState[action.index].stage = action.stage;
  newState[action.index].isComplete = false;
  const { isValid, syntaxError } = validateStage(newState[action.index]);
  newState[action.index].isValid = isValid;
  newState[action.index].syntaxError = syntaxError;
  return newState;
};

/**
 * Add a stage.
 *
 * @param {Object} state - The state.
 *
 * @returns {Object} The new state.
 */
const addStage = (state: State): State => {
  const newState = copyState(state);
  newState.push(emptyStage());
  return newState;
};

/**
 * Add a stage after current one.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const addAfterStage = (state: State, action: AnyAction): State => {
  const newState = copyState(state);
  const newStage = { ...emptyStage() };
  newState.splice(Number(action.index) + 1, 0, newStage);
  return newState;
};

/**
 * Delete a stage.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const deleteStage = (state: State, action: AnyAction): State => {
  const newState = copyState(state);
  newState.splice(action.index, 1);
  return newState;
};

/**
 * Move a stage in the pipeline.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const moveStage = (state: State, action: AnyAction): State => {
  const newState = copyState(state);
  newState.splice(action.toIndex, 0, newState.splice(action.fromIndex, 1)[0]);
  return newState;
};

/**
 * Select a stage operator.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const selectStageOperator = (state: State, action: AnyAction): State => {
  const operatorName = action.stageOperator;
  const oldStage = state[action.index];

  if (operatorName === oldStage.stageOperator) {
    return state;
  }

  // If the value of the existing state operator has not been modified by user,
  // we can easily replace it or else persist the one user changed
  let value;
  if (hasUserChangedStage(oldStage, action.env)) {
    value = oldStage.stage;
  } else {
    value = getStageDefaultValue(operatorName, action.isCommenting, action.env);
  }

  const newState = copyState(state);

  newState[action.index].stageOperator = operatorName;
  newState[action.index].stage = value;
  newState[action.index].isExpanded = true;
  newState[action.index].isComplete = false;
  newState[action.index].previewDocuments = [];
  newState[action.index].isMissingAtlasOnlyStageSupport = !!(
    [SEARCH, SEARCH_META, DOCUMENTS].includes(operatorName) &&
    action.env !== ADL &&
    action.env !== ATLAS
  );

  // Re-validate the stage according to the new operator
  const { isValid, syntaxError } = validateStage(newState[action.index]);
  newState[action.index].isValid = isValid;
  newState[action.index].syntaxError = syntaxError;

  // Clear the server error when we change the stage operator because it isn't
  // relevant anymore
  newState[action.index].error = null;

  return newState;
};

export const replaceOperatorSnippetTokens = (str: string): string => {
  const regex = /\${[0-9]+:?([a-z0-9.()]+)?}/gi;
  return str.replace(regex, function (_match, replaceWith) {
    return replaceWith ?? '';
  });
};

const getStageDefaultValue = (
  stageOperator: string,
  isCommenting: boolean,
  env: typeof ENVS[number]
): string => {
  const operatorDetails = getStageOperator(stageOperator, env);
  const snippet = (operatorDetails || {}).snippet || DEFAULT_SNIPPET;
  const comment = (operatorDetails || {}).comment || '';
  return replaceOperatorSnippetTokens(
    isCommenting ? `${comment}${snippet}` : snippet
  );
};

const hasUserChangedStage = (stage: StageState, env: typeof ENVS[number]): boolean => {
  if (!stage.stageOperator || !stage.stage) {
    return false;
  }
  const value = decomment(stage.stage);
  // The default value contains ace specific tokens (${1:name}).
  const defaultValue = getStageDefaultValue(stage.stageOperator, false, env);
  return value !== defaultValue;
};

/**
 * Toggle if a stage is enabled.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const toggleStage = (state: State, action: AnyAction): State => {
  const newState = copyState(state);
  newState[action.index].isEnabled = !newState[action.index].isEnabled;
  return newState;
};

/**
 * Toggle if a stage is collapsed.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const toggleStageCollapse = (state: State, action: AnyAction): State => {
  const newState = copyState(state);
  newState[action.index].isExpanded = !newState[action.index].isExpanded;
  return newState;
};

/**
 * Update the stage preview.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const updateStagePreview = (state: State, action: AnyAction): State => {
  const newState = copyState(state);
  if (
    [SEARCH, SEARCH_META, DOCUMENTS].includes(
      newState[action.index].stageOperator
    ) &&
    action.env !== ADL &&
    action.env !== ATLAS &&
    action.error &&
    (action.error.code === 40324 /* Unrecognized pipeline stage name */ ||
      action.error.code ===
        31082) /* The full-text search stage is not enabled */
  ) {
    newState[action.index].previewDocuments = [];
    newState[action.index].error = null;
    newState[action.index].isMissingAtlasOnlyStageSupport = true;
  } else {
    newState[action.index].previewDocuments =
      action.error === null || action.error === undefined
        ? action.documents
        : [];
    newState[action.index].error = action.error ? action.error.message : null;
    newState[action.index].isMissingAtlasOnlyStageSupport = false;
  }
  newState[action.index].isLoading = false;
  newState[action.index].isComplete = action.isComplete;
  return newState;
};

/**
 * Set stage results loading.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const stageResultsLoading = (state: State, action: AnyAction): State => {
  const newState = copyState(state);
  newState[action.index].isLoading = true;
  return newState;
};

const autoPreviewToggled = (state: State, action: AnyAction): State => {
  // Clean up server errors when autopreview is disabled so that the user is
  // able to run the pipeline
  if ((action as AutoPreviewToggledAction).value === false) {
    return copyState(state).map((stage) => {
      stage.error = null;
      return stage;
    });
  }
  return state;
};

const onConfirmNew = (_state: State, action: AnyAction) => {
  return action.error ? [] : action.pipeline;
};

const onProjectionsChanged = (state: State, action: AnyAction) => {
  return copyState(state).map((stage, index) => {
    stage.projections = action.projections.filter(
      (projection: { index: number }) => {
        return projection.index === index;
      }
    );
    return stage;
  });
};

const doClearPipeline = () => INITIAL_STATE;

const restorePipeline = (_state: State, action: AnyAction) =>
  action.restoreState.pipeline;

/**
 * To not have a huge switch statement in the reducer.
 */
const MAPPINGS: Record<string, (state: State, action: AnyAction) => State> = {};

MAPPINGS[STAGE_CHANGED] = changeStage;
MAPPINGS[STAGE_ADDED] = addStage;
MAPPINGS[STAGE_ADDED_AFTER] = addAfterStage;
MAPPINGS[STAGE_DELETED] = deleteStage;
MAPPINGS[STAGE_MOVED] = moveStage;
MAPPINGS[STAGE_OPERATOR_SELECTED] = selectStageOperator;
MAPPINGS[STAGE_TOGGLED] = toggleStage;
MAPPINGS[STAGE_COLLAPSE_TOGGLED] = toggleStageCollapse;
MAPPINGS[STAGE_PREVIEW_UPDATED] = updateStagePreview;
MAPPINGS[LOADING_STAGE_RESULTS] = stageResultsLoading;
MAPPINGS[AutoPreviewActionTypes.AutoPreviewToggled] = autoPreviewToggled;
MAPPINGS[CONFIRM_NEW] = onConfirmNew;
MAPPINGS[PROJECTIONS_CHANGED] = onProjectionsChanged;
MAPPINGS[NEW_PIPELINE] = doClearPipeline;
MAPPINGS[CLEAR_PIPELINE] = doClearPipeline;
MAPPINGS[RESTORE_PIPELINE] = restorePipeline;

/**
 * Reducer function for handle state changes to pipeline.
 */
export default function reducer(
  state = [emptyStage()],
  action: AnyAction
): State {
  const fn = MAPPINGS[action.type];
  return fn ? fn(state, action) : state;
}

/**
 * The clear pipeline action
 */
export const clearPipeline = () => ({
  type: CLEAR_PIPELINE
});

/**
 * Action creator for adding a stage.
 */
export const stageAdded =
  (): PipelineBuilderThunkAction<void> => (dispatch, getState) => {
    const { pipeline } = getState();
    track('Aggregation Edited', {
      num_stages: pipeline.length,
      stage_action: 'stage_added',
      stage_name: null
    });
    dispatch({
      type: STAGE_ADDED
    });
  };

/**
 * Action creator for adding a stage after current one.
 * @param {Number} index - The index of the stage.
 *
 * @returns {Object} the stage added after action.
 */
export const stageAddedAfter =
  (index: number): PipelineBuilderThunkAction<void> =>
  (dispatch, getState) => {
    const { pipeline } = getState();
    track('Aggregation Edited', {
      num_stages: pipeline.length,
      stage_action: 'stage_added',
      stage_name: null
    });
    dispatch({
      type: STAGE_ADDED_AFTER,
      index
    });
  };

/**
 * Action creator for stage changed events.
 *
 * @param {String} value - The stage text value.
 * @param {Number} index - The index of the stage.
 *
 * @returns {Object} The stage changed action.
 */
export const stageChanged =
  (
    value: string | undefined,
    index: number
  ): PipelineBuilderThunkAction<void> =>
  (dispatch) => {
    dispatch({
      type: STAGE_CHANGED,
      index: index,
      stage: value
    });
    dispatch(projectionsChanged());
    dispatch(setIsModified(true));
    dispatch(runStage(index));
  };

/**
 * Action creator for toggling whether the stage is collapsed.
 *
 * @param {Number} index - The index of the stage.
 *
 * @returns {Object} The stage collapse toggled action.
 */
export const stageCollapseToggled = (index: number): AnyAction => ({
  type: STAGE_COLLAPSE_TOGGLED,
  index: index
});

/**
 * Action creator for stage deleted events.
 *
 * @param {Number} index - The index of the stage.
 *
 * @returns {Object} The stage deleted action.
 */
export const stageDeleted =
  (index: number): PipelineBuilderThunkAction<void> =>
  (dispatch, getState) => {
    const { pipeline } = getState();
    track('Aggregation Edited', {
      num_stages: pipeline.length,
      stage_action: 'stage_removed',
      stage_name: pipeline[index].stageOperator
    });
    dispatch({
      type: STAGE_DELETED,
      index
    });
  };

/**
 * Action creator for stage moved events.
 *
 * @param {Number} fromIndex - The original index.
 * @param {Number} toIndex - The index to move to.
 *
 * @returns {Object} The stage moved action.
 */
export const stageMoved =
  (fromIndex: number, toIndex: number): PipelineBuilderThunkAction<void> =>
  (dispatch, getState) => {
    if (fromIndex === toIndex) return;
    const { pipeline } = getState();
    track('Aggregation Edited', {
      num_stages: pipeline.length,
      stage_action: 'stage_reordered',
      stage_name: pipeline[fromIndex].stageOperator
    });
    dispatch({
      type: STAGE_MOVED,
      fromIndex: fromIndex,
      toIndex: toIndex
    });
  };

/**
 * Action creator for stage operator selected events.
 *
 * @param {Number} index - The index of the stage.
 * @param {String} operator - The stage operator.
 * @param {Boolean} isCommenting - If comment mode is enabled.
 * @param {String} env - The environment.
 *
 * @returns {Object} The stage operator selected action.
 */
export const stageOperatorSelected =
  (
    index: number,
    stageOperator: string,
    isCommenting: boolean,
    env: string
  ): PipelineBuilderThunkAction<void> =>
  (dispatch, getState) => {
    const { pipeline } = getState();
    if (pipeline[index].stageOperator === stageOperator) return;
    track('Aggregation Edited', {
      num_stages: pipeline.length,
      stage_action: 'stage_renamed',
      stage_name: stageOperator
    });
    dispatch({
      type: STAGE_OPERATOR_SELECTED,
      index,
      stageOperator,
      isCommenting,
      env
    });
  };

/**
 * Handles toggling a stage on/off.
 *
 * @param {Number} index - The stage index.
 *
 * @returns {Object} The stage toggled action.
 */
export const stageToggled = (index: number): AnyAction => ({
  type: STAGE_TOGGLED,
  index: index
});

/**
 * Update the stage preview section aciton.
 *
 * @param {Array} docs - The documents.
 * @param {Number} index - The index.
 * @param {Error} error - The error.
 * @param {Boolean} isComplete - If the preview is complete.
 * @param {string} env -
 *
 * @returns {Object} The action.
 */
export const stagePreviewUpdated = (
  docs: unknown[],
  index: number,
  error: Error | null,
  isComplete: boolean,
  env: string
): AnyAction => {
  return {
    type: STAGE_PREVIEW_UPDATED,
    documents: docs,
    index: index,
    error: error,
    isComplete: isComplete,
    env
  };
};

/**
 * The loading stage results action.
 *
 * @param {Number} index - The stage index.
 *
 * @returns {Object} The action.
 */
export const loadingStageResults = (index: number): AnyAction => ({
  type: LOADING_STAGE_RESULTS,
  index: index
});

export const generatePipelineAsString = (state: RootState, index: number) => {
  return `[${state.pipeline
    .filter((s, i) => s.isEnabled && i <= index)
    .map((s) => generateStageAsString(s))
    .join(', ')}]`;
};

/**
 * Execute the aggregation pipeline at the provided index. The previous execute
 * request will be canceled in cases when another is dispatched while the
 * previous one is in-flight
 *
 * @param index - The current index.
 * @param force - Whether or not the execution should start immediately
 */
const executeAggregation = (
  index: number,
  force: boolean
): PipelineBuilderThunkAction<Promise<void>> => {
  return async (dispatch, getState, { pipelinePreviewManager }) => {
    const {
      pipeline,
      namespace,
      maxTimeMS,
      collationString,
      limit,
      largeLimit,
      inputDocuments
    } = getState();

    const stage = pipeline[index];

    stage.executor = generateStage(stage);

    if (
      stage.isValid &&
      stage.isEnabled &&
      stage.stageOperator &&
      ![OUT, MERGE].includes(stage.stageOperator)
    ) {
      try {
        dispatch(loadingStageResults(index));

        const previewPipeline = (
          mapPipelineToStages(pipeline) as Document[]
        ).slice(0, index + 1);

        const options: AggregateOptions = {
          maxTimeMS: maxTimeMS ?? DEFAULT_MAX_TIME_MS,
          collation: collationString.value ?? undefined
        };

        const previewOptions = {
          sampleSize: largeLimit ?? DEFAULT_LARGE_LIMIT,
          previewSize: limit ?? DEFAULT_SAMPLE_SIZE,
          totalDocumentCount: inputDocuments.count
        };

        const previewDocuments =
          await pipelinePreviewManager.getPreviewForStage(
            index,
            namespace,
            previewPipeline,
            { ...options, ...previewOptions },
            force
          );

        dispatch(
          stagePreviewUpdated(
            previewDocuments,
            index,
            null,
            true,
            getState().env
          )
        );

        dispatch(
          globalAppRegistryEmit('agg-pipeline-executed', {
            id: getState().id,
            numStages: getState().pipeline.length,
            stageOperators: getState().pipeline.map((s) => s.stageOperator)
          })
        );
      } catch (error) {
        if (isCancelError(error)) {
          return;
        }
        dispatch(
          stagePreviewUpdated([], index, error as Error, false, getState().env)
        );
      }
    } else {
      dispatch(stagePreviewUpdated([], index, null, false, getState().env));
    }
  };
};

/**
 * Go to the $merge results collection.
 *
 * @param {Number} index - The stage index.
 *
 * @returns {Function} The thunk function.
 */
export const gotoMergeResults = (
  index: number
): PipelineBuilderThunkAction<void> => {
  return (dispatch, getState) => {
    const state = getState();
    const database = toNS(state.namespace).database;
    const outNamespace = parseNamespace(database, state.pipeline[index]);
    if (state.outResultsFn) {
      state.outResultsFn(outNamespace);
    } else {
      dispatch(
        globalAppRegistryEmit(
          'aggregations-open-result-namespace',
          outNamespace
        )
      );
    }
  };
};

/**
 * Go to the $out results collection.
 *
 * @param {String} collection - The collection name.
 *
 * @returns {Function} The thunk function.
 */
export const gotoOutResults = (
  collection: string
): PipelineBuilderThunkAction<void> => {
  return (dispatch, getState) => {
    const state = getState();
    const database = toNS(state.namespace).database;
    const outNamespace = `${database}.${collection.replace(/"/g, '')}`;
    if (state.outResultsFn) {
      state.outResultsFn(outNamespace);
    } else {
      dispatch(
        globalAppRegistryEmit(
          'aggregations-open-result-namespace',
          outNamespace
        )
      );
    }
  };
};

export const goToNamespace = (namespace: string): AnyAction => {
  return globalAppRegistryEmit('aggregations-open-result-namespace', namespace);
};

/**
 * Run just the out stage.
 *
 * @param {Number} index - The index of the stage.
 *
 * @returns {Function} The thunk function.
 */
export const runOutStage = (
  index: number
): PipelineBuilderThunkAction<Promise<void>> => {
  return async (dispatch, getState) => {
    const {
      id,
      dataService: { dataService },
      namespace,
      pipeline,
      maxTimeMS,
      collationString
    } = getState();

    if (!dataService) {
      return;
    }

    try {
      dispatch(loadingStageResults(index));
      const outPipeline = mapPipelineToStages(pipeline.slice(0, index + 1));
      const options: AggregateOptions = {
        maxTimeMS: maxTimeMS ?? DEFAULT_MAX_TIME_MS,
        collation: collationString.value ?? undefined,
        allowDiskUse: true
      };
      const cursor = dataService.aggregate(namespace, outPipeline, options);
      const result = await cursor.toArray();
      void cursor.close();
      dispatch(stagePreviewUpdated(result, index, null, true, getState().env));
      dispatch(globalAppRegistryEmit('agg-pipeline-out-executed', { id }));
    } catch (error) {
      dispatch(
        stagePreviewUpdated([], index, error as Error, true, getState().env)
      );
    }
  };
};

export const runStage = (
  index: number,
  forceExecute = false
): PipelineBuilderThunkAction<void> => {
  return (dispatch, getState, { pipelinePreviewManager }) => {
    const { id, autoPreview, pipeline } = getState();
    pipelinePreviewManager.clearQueue(index);
    if (!autoPreview) {
      return;
    }
    if (id === '') {
      dispatch(createId());
    }
    for (let i = index; i < pipeline.length; i++) {
      void dispatch(executeAggregation(i, forceExecute));
    }
  };
};
