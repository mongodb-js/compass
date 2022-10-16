import { ADL, ATLAS, STAGE_OPERATORS } from 'mongodb-ace-autocompleter';
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
import type { PipelineBuilderThunkAction } from '.';
import type { AggregateOptions, Document, MongoError } from 'mongodb';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { projectionsChanged, PROJECTIONS_CHANGED } from './projections';
import { setIsModified } from './is-modified';
import type { AutoPreviewToggledAction } from './auto-preview';
import { ActionTypes as AutoPreviewActionTypes } from './auto-preview';
import { CONFIRM_NEW, NEW_PIPELINE } from './import-pipeline';
import { RESTORE_PIPELINE } from './saved-pipeline';
import { isCancelError } from '../utils/cancellable-promise';

const { track } = createLoggerAndTelemetry(
  'COMPASS-AGGREGATIONS-UI'
);

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
}

type StageOperator = {
  name: string;
  value: string;
  label: string;
  score: number;
  env: string[];
  meta: string;
  version: string;
  apiVersions: number[];
  description: string;
  comment: string;
  snippet: string;
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
const copyState = (state: State): State => state.map(s => Object.assign({}, s));

/**
 * Get a stage operator details from the provided operator name.
 *
 * @param {String} name - The stage operator name.
 * @param {String} env - The environment.
 *
 * @returns {Object} The stage operator details.
 */
const getStageOperator = (name: string, env: string): StageOperator | undefined => {
  return (STAGE_OPERATORS as StageOperator[]).find((op) => {
    return op.name === name && op.env.includes(env);
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
  newState[action.index].isValid = !action.syntaxError;
  newState[action.index].syntaxError = action.syntaxError;
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
  const newState = copyState(state);
  const stage = Object.assign({}, newState[action.index], action.attributes);
  newState[action.index] = stage;
  return newState;
};

export const replaceOperatorSnippetTokens = (str: string): string => {
  const regex = /\${[0-9]+:?([a-z0-9.()]+)?}/ig;
  return str.replace(regex, function (_match, replaceWith) {
    return replaceWith ?? '';
  });
}

const getStageDefaultValue = (stageOperator: string, isCommenting: boolean, env: string): string => {
  const operatorDetails = getStageOperator(stageOperator, env);
  const snippet = (operatorDetails || {}).snippet || DEFAULT_SNIPPET;
  const comment = (operatorDetails || {}).comment || '';
  return replaceOperatorSnippetTokens(isCommenting ? `${comment}${snippet}` : snippet);
};

const hasUserChangedStage = (stage: StageState, env: string): boolean => {
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
  newState[action.index].isEnabled = action.isEnabled;
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
  const stage = Object.assign({}, newState[action.index], action.attributes);
  newState[action.index] = stage;
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
}

const onConfirmNew = (_state: State, action: AnyAction) => {
  return action.error ? [] : action.pipeline;
}

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

const restorePipeline = (_state: State, action: AnyAction) => action.restoreState.pipeline

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
export default function reducer(state = [emptyStage()], action: AnyAction): State {
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
  (): PipelineBuilderThunkAction<void> => (dispatch, getState, { pipelineBuilder }) => {
    const { pipeline } = getState();
    pipelineBuilder.addStage();
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
    (dispatch, getState, { pipelineBuilder }) => {
      const { pipeline } = getState();
      pipelineBuilder.addStage(index);
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
    value: string,
    index: number
  ): PipelineBuilderThunkAction<void> =>
    (dispatch, _getState, { pipelineBuilder }) => {
      const stage = pipelineBuilder.changeStageValue(index, value);
      dispatch({
        type: STAGE_CHANGED,
        index,
        stage: value,
        syntaxError: stage.syntaxError?.message
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
    (dispatch, getState, { pipelineBuilder }) => {
      const { pipeline } = getState();
      pipelineBuilder.removeStage(index);
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
  (
    fromIndex: number,
    toIndex: number
  ): PipelineBuilderThunkAction<void> =>
    (dispatch, getState, { pipelineBuilder }) => {
      if (fromIndex === toIndex) return;
      pipelineBuilder.moveStage(fromIndex, toIndex);
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
    (dispatch, getState, { pipelineBuilder }) => {
      const { pipeline } = getState();
      const oldStage = pipeline[index];
      if (pipeline[index].stageOperator === stageOperator) return;

      const { syntaxError } = pipelineBuilder.changeStageOperator(index, stageOperator);

      // If the value of the existing state operator has not been modified by user,
      // we can easily replace it or else persist the one user changed
      const stageValue = hasUserChangedStage(oldStage, env)
        ? oldStage.stage
        : getStageDefaultValue(stageOperator, isCommenting, env);

      pipelineBuilder.changeStageValue(index, stageValue);

      const attributes: Partial<StageState> = {
        stageOperator,
        stage: stageValue,
        isExpanded: true,
        isComplete: false,
        previewDocuments: [],
        isValid: !syntaxError,
        syntaxError: syntaxError?.message,
        error: null, // The operator changed and server error is not valid anymore
        isMissingAtlasOnlyStageSupport: isMissingAtlasOnlyStageSupport(stageOperator, env),
      };

      track('Aggregation Edited', {
        num_stages: pipeline.length,
        stage_action: 'stage_renamed',
        stage_name: stageOperator
      });
      dispatch({
        type: STAGE_OPERATOR_SELECTED,
        index,
        attributes,
      });
    };

/**
 * Handles toggling a stage on/off.
 *
 * @param {Number} index - The stage index.
 *
 * @returns {Object} The stage toggled action.
 */
export const stageToggled = (index: number): PipelineBuilderThunkAction<void> =>
  (dispatch, getState, { pipelineBuilder }) => {
    const { pipeline } = getState();
    const isEnabled = pipeline[index].isEnabled;
    pipelineBuilder.changeStageDisabled(index, isEnabled);
    dispatch({
      type: STAGE_TOGGLED,
      index,
      isEnabled: !isEnabled
    });
  };

/**
 * Update the stage preview section aciton.
 *
 * @param docs - The documents.
 * @param index - The index.
 * @param error - The error.
 * @param isComplete - If the preview is complete.
 * @param env -
 *
 * @returns {Object} The action.
 */
export const stagePreviewUpdated = (
  docs: Document[],
  index: number,
  error: MongoError | null,
  isComplete: boolean,
  env: string
): PipelineBuilderThunkAction<void> => {
  return (dispatch, getState) => {
    const { pipeline } = getState();
    const { stageOperator } = pipeline[index];

    const attributes: Partial<StageState> = {
      isLoading: false,
      isComplete,
      previewDocuments: error ? [] : docs,
      error: error ? error.message : null,
      isMissingAtlasOnlyStageSupport: false,
    };

    if (
      isMissingAtlasOnlyStageSupport(stageOperator, env) &&
      (
        error && (
          (error).code === 40324 /* Unrecognized pipeline stage name */ ||
          (error).code === 31082 /* The full-text search stage is not enabled */
        )
      )
    ) {
      attributes.previewDocuments = [];
      attributes.error = null;
      attributes.isMissingAtlasOnlyStageSupport = true;
    }

    dispatch({
      type: STAGE_PREVIEW_UPDATED,
      index,
      attributes,
    });
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
  return async (dispatch, getState, { pipelineBuilder }) => {
    const { pipeline, env } = getState();
    const stage = pipeline[index];

    const canRunStage = stage.isValid &&
      stage.isEnabled &&
      stage.stageOperator &&
      ![OUT, MERGE].includes(stage.stageOperator);

    if (!canRunStage) {
      dispatch(stagePreviewUpdated([], index, null, false, env));
      return;
    }

    const {
      id,
      namespace,
      maxTimeMS,
      collationString,
      limit,
      largeLimit,
      inputDocuments
    } = getState();

    try {
      dispatch(loadingStageResults(index));

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
        await pipelineBuilder.getPreviewForStage(
          index,
          namespace,
          { ...options, ...previewOptions },
          force
        );

      dispatch(
        stagePreviewUpdated(previewDocuments, index, null, true, env)
      );

      dispatch(
        globalAppRegistryEmit('agg-pipeline-executed', {
          id,
          numStages: pipeline.length,
          stageOperators: pipeline.map((s) => s.stageOperator)
        })
      );
    } catch (error) {
      if (isCancelError(error)) {
        return;
      }
      dispatch(
        stagePreviewUpdated([], index, error as MongoError, false, env)
      );
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
export const gotoMergeResults = (index: number): PipelineBuilderThunkAction<void> => {
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
export const gotoOutResults = (collection: string): PipelineBuilderThunkAction<void> => {
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
      env,
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
      dispatch(stagePreviewUpdated(result, index, null, true, env));
      dispatch(globalAppRegistryEmit('agg-pipeline-out-executed', { id }));
    } catch (error) {
      dispatch(
        stagePreviewUpdated([], index, error as MongoError, true, env)
      );
    }
  };
};

export const runStage = (
  index: number,
  forceExecute = false
): PipelineBuilderThunkAction<void> => {
  return (dispatch, getState) => {
    const { id, autoPreview, pipeline } = getState();
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

const isMissingAtlasOnlyStageSupport = (operator: string, env: string): boolean => {
  return [SEARCH, SEARCH_META, DOCUMENTS].includes(operator) &&
    env !== ADL && env !== ATLAS
    ;
}