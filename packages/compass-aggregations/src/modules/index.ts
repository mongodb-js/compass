import { combineReducers } from 'redux';
import type { AnyAction , Reducer } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import { ObjectId } from 'bson';
import isEmpty from 'lodash.isempty';
import fs from 'fs';
import path from 'path';

import dataService, { INITIAL_STATE as DS_INITIAL_STATE } from './data-service';
import fields, { INITIAL_STATE as FIELDS_INITIAL_STATE } from './fields';
import editViewName, { INITIAL_STATE as EDIT_VIEW_NAME_INITIAL_STATE } from './edit-view-name';
import sourceName, { INITIAL_STATE as SOURCE_NAME_INITIAL_STATE } from './source-name';


import inputDocuments, {
  INITIAL_STATE as INPUT_INITIAL_STATE
} from './input-documents';
import namespace, {
  INITIAL_STATE as NS_INITIAL_STATE,
  NAMESPACE_CHANGED
} from './namespace';
import env, {
  INITIAL_STATE as ENV_INITIAL_STATE
} from './env';
import isTimeSeries, {
  INITIAL_STATE as IS_TIME_SERIES_INITIAL_STATE
} from './is-time-series';
import serverVersion, {
  INITIAL_STATE as SV_INITIAL_STATE
} from './server-version';
import isModified, {
  INITIAL_STATE as IS_MODIFIED_INITIAL_STATE
} from './is-modified';
import pipeline, {
  runStage,
  INITIAL_STATE as PIPELINE_INITIAL_STATE
} from './pipeline';
import name, { INITIAL_STATE as NAME_INITIAL_STATE } from './name';
import limit, { INITIAL_STATE as LIMIT_INITIAL_STATE } from './limit';
import largeLimit, {
  INITIAL_STATE as LARGE_LIMIT_INITIAL_STATE
} from './large-limit';
import isAtlasDeployed, {
  INITIAL_STATE as IS_ATLAS_DEPLOYED_INITIAL_STATE
} from './is-atlas-deployed';
import isReadonly, {
  INITIAL_STATE as IS_READONLY_INITIAL_STATE
} from './is-readonly';
import maxTimeMS, {
  INITIAL_STATE as MAX_TIME_MS_INITIAL_STATE
} from './max-time-ms';
import collationString, {
  getCollationStateFromString,
  INITIAL_STATE as COLLATION_STRING_INITIAL_STATE
} from './collation-string';
import comments, { INITIAL_STATE as COMMENTS_INITIAL_STATE } from './comments';
import sample, { INITIAL_STATE as SAMPLE_INITIAL_STATE } from './sample';
import autoPreview, {
  INITIAL_STATE as AUTO_PREVIEW_INITIAL_STATE
} from './auto-preview';
import id, { INITIAL_STATE as ID_INITIAL_STATE } from './id';
import savedPipeline, {
  updatePipelineList,
  INITIAL_STATE as SP_INITIAL_STATE
} from './saved-pipeline';
import restorePipeline, {
  INITIAL_STATE as RESTORE_PIPELINE_STATE
} from './restore-pipeline';
import importPipeline, {
  INITIAL_STATE as IMPORT_PIPELINE_INITIAL_STATE,
  CONFIRM_NEW,
  createPipeline,
  createPipelineFromView
} from './import-pipeline';
import appRegistry, {
  localAppRegistryEmit,
  globalAppRegistryEmit,
  INITIAL_STATE as APP_REGISTRY_STATE
} from '@mongodb-js/mongodb-redux-common/app-registry';
import isOverviewOn, {
  TOGGLE_OVERVIEW,
  INITIAL_STATE as OVERVIEW_INITIAL_STATE
} from './is-overview-on';
import settings, {
  APPLY_SETTINGS,
  INITIAL_STATE as SETTINGS_INITIAL_STATE
} from './settings';
import isFullscreenOn, {
  INITIAL_STATE as FULLSCREEN_INITIAL_STATE
} from './is-fullscreen-on';
import savingPipeline, {
  INITIAL_STATE as SAVING_PIPELINE_INITIAL_STATE,
  SAVING_PIPELINE_APPLY
} from './saving-pipeline';
import outResultsFn, {
  INITIAL_STATE as OUT_RESULTS_FN_INITIAL_STATE
} from './out-results-fn';
import projections, {
  INITIAL_STATE as PROJECTIONS_INITIAL_STATE,
  PROJECTIONS_CHANGED
} from './projections';
import isNewPipelineConfirm, {
  INITIAL_STATE as IS_NEW_PIPELINE_CONFIRM_STATE
} from './is-new-pipeline-confirm';
import { gatherProjections, generateStage } from './stage';
import updateViewError, {
  INITIAL_STATE as UPDATE_VIEW_ERROR_INITIAL_STATE
} from './update-view';
import aggregation, {
  INITIAL_STATE as AGGREGATION_INITIAL_STATE
} from './aggregation';
import countDocuments, {
  INITIAL_STATE as COUNT_INITIAL_STATE
} from './count-documents';

import explain, {
  INITIAL_STATE as EXPLAIN_INITIAL_STATE
} from './explain';

import isDataLake, {
  INITIAL_STATE as DATALAKE_INITIAL_STATE
} from './is-datalake';

import workspace, {
  INITIAL_STATE as WORKSPACE_INITIAL_STATE
} from './workspace';
import aggregationWorkspaceId from './aggregation-workspace-id';
import indexes, {
  INITIAL_STATE as INDEXES_INITIAL_STATE,
} from './indexes';

import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { track, debug } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

import { getDirectory } from '../utils/get-directory';
import { PipelineStorage } from '../utils/pipeline-storage';

import type { Pipeline, Projection } from './pipeline';

/**
 * The intial state of the root reducer.
 */
export const INITIAL_STATE = {
  appRegistry: APP_REGISTRY_STATE,
  dataService: DS_INITIAL_STATE,
  fields: FIELDS_INITIAL_STATE,
  inputDocuments: INPUT_INITIAL_STATE,
  namespace: NS_INITIAL_STATE,
  env: ENV_INITIAL_STATE,
  isTimeSeries: IS_TIME_SERIES_INITIAL_STATE,
  serverVersion: SV_INITIAL_STATE,
  pipeline: PIPELINE_INITIAL_STATE,
  savedPipeline: SP_INITIAL_STATE,
  restorePipeline: RESTORE_PIPELINE_STATE,
  name: NAME_INITIAL_STATE,
  collationString: COLLATION_STRING_INITIAL_STATE,
  isAtlasDeployed: IS_ATLAS_DEPLOYED_INITIAL_STATE,
  isReadonly: IS_READONLY_INITIAL_STATE,
  isOverviewOn: OVERVIEW_INITIAL_STATE,
  comments: COMMENTS_INITIAL_STATE,
  sample: SAMPLE_INITIAL_STATE,
  autoPreview: AUTO_PREVIEW_INITIAL_STATE,
  id: ID_INITIAL_STATE,
  isModified: IS_MODIFIED_INITIAL_STATE,
  importPipeline: IMPORT_PIPELINE_INITIAL_STATE,
  settings: SETTINGS_INITIAL_STATE,
  limit: LIMIT_INITIAL_STATE,
  largeLimit: LARGE_LIMIT_INITIAL_STATE,
  maxTimeMS: MAX_TIME_MS_INITIAL_STATE,
  isFullscreenOn: FULLSCREEN_INITIAL_STATE,
  savingPipeline: SAVING_PIPELINE_INITIAL_STATE,
  projections: PROJECTIONS_INITIAL_STATE as Projection[],
  outResultsFn: OUT_RESULTS_FN_INITIAL_STATE as null | ((namespace: string) => void),
  editViewName: EDIT_VIEW_NAME_INITIAL_STATE,
  sourceName: SOURCE_NAME_INITIAL_STATE,
  isNewPipelineConfirm: IS_NEW_PIPELINE_CONFIRM_STATE,
  updateViewError: UPDATE_VIEW_ERROR_INITIAL_STATE,
  aggregation: AGGREGATION_INITIAL_STATE,
  workspace: WORKSPACE_INITIAL_STATE,
  countDocuments: COUNT_INITIAL_STATE,
  explain: EXPLAIN_INITIAL_STATE,
  isDataLake: DATALAKE_INITIAL_STATE,
  indexes: INDEXES_INITIAL_STATE,
};

/**
 * Reset action constant.
 */
export const RESET = 'aggregations/reset';

/**
 * Clear the pipeline name.
 */
export const CLEAR_PIPELINE = 'aggregations/CLEAR_PIPELINE';

/**
 * Restore action constant.
 */
export const RESTORE_PIPELINE = 'aggregations/RESTORE_PIPELINE';

/**
 * New pipeline action name.
 */
export const NEW_PIPELINE = 'aggregations/NEW_PIPELINE';

/**
 * Clone pipeline action name.
 */
export const CLONE_PIPELINE = 'aggregations/CLONE_PIPELINE';

export const NEW_FROM_PASTE = 'aggregations/NEW_FROM_PASTE';
export const MODIFY_VIEW = 'aggregations/MODIFY_VIEW';

/**
 * The main application reducer.
 *
 * this does not include save state and restore state reducers as those need to
 * be handled differently in the default reducer
 *
 * @returns {Function} The reducer function.
 */
const appReducer = combineReducers({
  appRegistry,
  comments,
  sample,
  autoPreview,
  dataService,
  fields,
  inputDocuments,
  namespace,
  env,
  isTimeSeries,
  serverVersion,
  savedPipeline,
  restorePipeline,
  pipeline,
  name,
  collationString,
  id,
  isModified,
  isAtlasDeployed,
  isReadonly,
  importPipeline,
  isOverviewOn,
  settings,
  limit,
  largeLimit,
  maxTimeMS,
  isFullscreenOn,
  savingPipeline,
  projections,
  editViewName,
  sourceName,
  outResultsFn,
  isNewPipelineConfirm,
  updateViewError,
  aggregation,
  workspace,
  countDocuments,
  aggregationWorkspaceId,
  explain,
  isDataLake,
  indexes,
});

export type RootState = ReturnType<typeof appReducer>;

/**
 * Handle the namespace change.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const doNamespaceChanged = (state: RootState, action: AnyAction) => {

  const newState = {
    ...INITIAL_STATE,
    aggregationWorkspaceId: state.aggregationWorkspaceId,
    env: state.env,
    isTimeSeries: state.isTimeSeries,
    isReadonly: state.isReadonly,
    sourceName: state.sourceName,
    isAtlasDeployed: state.isAtlasDeployed,
    outResultsFn: state.outResultsFn,
    serverVersion: state.serverVersion,
    dataService: state.dataService,
    appRegistry: state.appRegistry
  };
  return appReducer(newState, action);
};

/**
 * Handle the reset.
 *
 * @returns {Object} The new state.
 */
const doReset = (state: RootState) => ({
  ...INITIAL_STATE,
  aggregationWorkspaceId: state.aggregationWorkspaceId
});

/**
 * Handle the pipeline restore.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const doRestorePipeline = (state: RootState, action: AnyAction): RootState => {
  const {
    id,
    name,
    comments,
    sample,
    autoPreview,
    collationString,
    limit,
    largeLimit,
    maxTimeMS,
    pipeline
  } = action.restoreState;

  return {
    // Current state will be mostly preserved (i.e, namespace, isTimeSeries, etc)
    ...state,
    // Everything that is stored as a pipeline is applied next
    id,
    name,
    comments,
    sample,
    autoPreview,
    collationString: getCollationStateFromString(collationString),
    limit,
    largeLimit,
    maxTimeMS,
    pipeline,
    // Relevant state that depens on the pipeline state is updated (NB: this
    // whole thing should be happening in the relevant slice reducers instead,
    // but changing how this plugin works is way too big of a task for this
    // particular patch)
    savedPipeline: {
      ...state.savedPipeline,
      isListVisible: false
    },
    restorePipeline: {
      isModalVisible: false,
      pipelineObjectID: ''
    }
  };
};

/**
 * Handle the pipeline clear.
 *
 * @param {Object} state - The state.
 *
 * @returns {Object} The new state.
 */
const doClearPipeline = (state: RootState): RootState => ({
  ...state,
  pipeline: [],
  limit: LIMIT_INITIAL_STATE,
  largeLimit: LARGE_LIMIT_INITIAL_STATE,
  maxTimeMS: MAX_TIME_MS_INITIAL_STATE,
  isAtlasDeployed: state.isAtlasDeployed,
  outResultsFn: state.outResultsFn,
  savedPipeline: {
    ...state.savedPipeline,
    isListVisible: true
  }
});

/**
 * Create a new pipeline.
 *
 * @param {Object} state - The state.
 *
 * @returns {Object} The new state.
 */
const createNewPipeline = (state: RootState): RootState => ({
  ...INITIAL_STATE,
  aggregationWorkspaceId: state.aggregationWorkspaceId,
  appRegistry: state.appRegistry,
  namespace: state.namespace,
  env: state.env,
  isTimeSeries: state.isTimeSeries,
  isReadonly: state.isReadonly,
  sourceName: state.sourceName,
  fields: state.fields,
  serverVersion: state.serverVersion,
  dataService: state.dataService,
  isAtlasDeployed: state.isAtlasDeployed,
  outResultsFn: state.outResultsFn,
  inputDocuments: state.inputDocuments
});

/**
 * Create a cloned pipeline.
 *
 * @param {Object} state - The state.
 *
 * @returns {Object} The new state.
 */
const createClonedPipeline = (state: RootState): RootState => ({
  ...state,
  id: new ObjectId().toHexString(),
  name: `${state.name} (copy)`,
  isModified: true
});

/**
 * Confirm importing the new pipeline.
 *
 * @param {Object} state - The state.
 *
 * @returns {Object} The new state.
 */
const doConfirmNewFromText = (state: RootState): RootState => {
  const pipe = createPipeline(state.importPipeline.text);
  const error = pipe.length > 0 ? pipe[0].syntaxError : null;
  if (!error) {
    track('Aggregation Imported From Text', { num_stages: pipe.length });
  }
  return {
    ...state,
    name: '',
    collationString: COLLATION_STRING_INITIAL_STATE,
    id: new ObjectId().toHexString(),
    pipeline: error ? [] : pipe,
    importPipeline: {
      isOpen: error ? true : false,
      isConfirmationNeeded: false,
      text: error ? state.importPipeline.text : '',
      syntaxError: error
    }
  };
};

const doModifyView = (state: RootState, action: AnyAction): RootState => {
  const pipe = createPipelineFromView(action.pipeline);
  return {
    ...state,
    editViewName: action.name,
    isReadonly: action.isReadonly,
    sourceName: action.sourceName,
    collationString: COLLATION_STRING_INITIAL_STATE,
    id: new ObjectId().toHexString(),
    pipeline: pipe,
    importPipeline: {
      isOpen: false,
      isConfirmationNeeded: false,
      text: '',
      syntaxError: null
    }
  };
};

/**
 * When <StageEditor /> is empty and you paste
 * what could be an aggregation pipeline.
 *
 * @see `newPipelineFromPaste()`
 * @param {Object} state
 * @param {Object} action
 * @returns {Object}
 */
const doNewFromPastedText = (state: RootState, action: AnyAction): RootState => {
  const pipe = createPipeline(action.text);
  const error = pipe.length > 0 ? pipe[0].syntaxError : null;
  /**
   * Do nothing if the text is not a valid pipeline.
   */
  if (error) {
    return state;
  }

  /**
   * Do nothing if you have more than default first stage.
   */
  if (state.pipeline.length > 1) {
    return state;
  }

  return {
    ...state,
    name: '',
    collationString: COLLATION_STRING_INITIAL_STATE,
    id: new ObjectId().toHexString(),
    pipeline: pipe,
    importPipeline: {
      isOpen: false,
      isConfirmationNeeded: false,
      text: action.text,
      syntaxError: error
    }
  };
};

/**
 * Toggles whether agg pipeline builder is in overview mode.
 * @param {Object} state
 * @returns {Object} The new state.
 */
const doToggleOverview = (state: RootState): RootState => {
  const newState = {
    ...state,
    isOverviewOn: !state.isOverviewOn
  };

  if (newState.pipeline) {
    newState.pipeline.forEach((pipe) => {
      pipe.isExpanded = !newState.isOverviewOn;
    });
  }

  if (newState.inputDocuments) {
    newState.inputDocuments.isExpanded = !newState.isOverviewOn;
  }
  return newState;
};

const doApplySettings = (state: RootState): RootState => {
  const newState = {
    ...state,
    limit: state.settings.sampleSize,
    largeLimit: state.settings.limit,
    comments: state.settings.isCommentMode,
    maxTimeMS: state.settings.maxTimeMS
  };

  newState.settings.isDirty = false;
  return newState;
};

const doApplySavingPipeline = (state: RootState): RootState => {
  const newState = {
    ...state,
    name: state.savingPipeline.name
  };

  newState.savingPipeline.isOpen = false;
  return newState;
};

const doProjectionsChanged = (state: RootState): RootState => {
  const newState = {
    ...state,
    projections: [] as Projection[],
  };

  newState.pipeline.map((_stage, index) => {
    _stage.projections = gatherProjections(_stage, null);
    _stage.projections.map((projection) => {
      projection.index = index;
      newState.projections.push(projection);
    });
  });
  return newState;
};

/**
 * The action to state modifier mappings.
 */
const MAPPINGS = {
  [NAMESPACE_CHANGED]: doNamespaceChanged,
  [RESET]: doReset,
  [RESTORE_PIPELINE]: doRestorePipeline,
  [CLEAR_PIPELINE]: doClearPipeline,
  [NEW_PIPELINE]: createNewPipeline,
  [CLONE_PIPELINE]: createClonedPipeline,
  [CONFIRM_NEW]: doConfirmNewFromText,
  [TOGGLE_OVERVIEW]: doToggleOverview,
  [APPLY_SETTINGS]: doApplySettings,
  [SAVING_PIPELINE_APPLY]: doApplySavingPipeline,
  [PROJECTIONS_CHANGED]: doProjectionsChanged,
  [NEW_FROM_PASTE]: doNewFromPastedText,
  [MODIFY_VIEW]: doModifyView
};

/**
 * The root reducer.
 *
 * @param state - The state.
 * @param action - The action.
 *
 * @returns The new state.
 */
const rootReducer: Reducer<RootState, AnyAction> = (state, action): RootState => {
  const fn = MAPPINGS[action.type];
  return (state && fn) ? fn(state, action) : appReducer(state, action);
};

export default rootReducer;

/**
 * Reset the entire state.
 *
 * @returns {Object} The action.
 */
export const reset = (): AnyAction => ({
  type: RESET
});

/**
 * The clear pipeline action.
 *
 * @returns {Object} The action.
 */
export const clearPipeline = (): AnyAction => ({
  type: CLEAR_PIPELINE
});

/**
 * Get the restore action.
 *
 * @param {Object} restoreState - The state.
 *
 * @returns {Object} The action.
 */
export const restoreSavedPipeline = (restoreState: unknown): AnyAction => ({
  type: RESTORE_PIPELINE,
  restoreState: restoreState
});

/**
 * The new pipeline action.
 *
 * @returns {Object} The action.
 */
export const newPipeline = (): AnyAction => ({
  type: NEW_PIPELINE
});

/**
 * The clone pipeline action.
 *
 * @returns {Object} The action.
 */
export const clonePipeline = (): AnyAction => ({
  type: CLONE_PIPELINE
});

const pipelineActionFromPaste = (text: string): AnyAction => ({
  type: NEW_FROM_PASTE,
  text: text
});

/**
 * Action creator <StageEditor /> calls if empty and you paste
 * what could be an aggregation pipeline.
 * @param {String} text
 * @returns {Object}
 */
export const newPipelineFromPaste = (text: string): ThunkAction<void, RootState, void, AnyAction> => {
  return (dispatch) => {
    dispatch(pipelineActionFromPaste(text));
    dispatch(globalAppRegistryEmit('compass:aggregations:pipeline-imported'));
  };
};

/**
 * Get the delete action.
 *
 * @param {String} pipelineId - The pipeline id.
 *
 * @returns {Function} The thunk function.
 */
export const deletePipeline = (pipelineId: string): ThunkAction<Promise<void>, RootState, void, AnyAction> => {
  return async (dispatch, getState) => {
    const pipelineStorage = new PipelineStorage();
    await pipelineStorage.delete(pipelineId);
    dispatch(updatePipelineList() as any);
    dispatch(clearPipeline());
    dispatch(
      globalAppRegistryEmit('agg-pipeline-deleted', {
        name: getState().name
      })
    );
  };
};

/**
 * Restore pipeline by an ID
 */
export const openPipelineById = (id: string): ThunkAction<Promise<void>, RootState, void, AnyAction> => {
  return async (dispatch) => {
    const file = path.join(getDirectory(), `${id}.json`);
    try {
      const data = await fs.promises.readFile(file, 'utf8')
      dispatch(openPipeline(JSON.parse(data)));
    } catch (e: unknown) {
      debug(e);
    }
  };
};

/**
 * Restore pipeline
 */
export const openPipeline = (pipeline: any): ThunkAction<void, RootState, void, AnyAction> => {
  return (dispatch) => {
    dispatch(clearPipeline());
    dispatch(restoreSavedPipeline(pipeline));
    dispatch(globalAppRegistryEmit('compass:aggregations:pipeline-opened'));
    dispatch(runStage(0, true /* force execute */));
  };
}

/**
 * Make view pipeline.
 *
 * @param {String} unfilteredPipeline - The unfilteredPipeline.
 *
 * @returns {Array} The mapped/filtered view pipeline.
 */
export const makeViewPipeline = (unfilteredPipeline: any[]) => {
  return unfilteredPipeline
    .map((p) => (p.executor || generateStage(p)))
    // generateStage can return {} under various conditions
    .filter((stage) => !isEmpty(stage));
};

/**
 * Open create view.
 *
 * @emits open-create-view {meta: {source, pipeline}}
 * @see create-view src/stores/create-view.js
 */
export const openCreateView = (): ThunkAction<void, RootState, void, AnyAction> => {
  return (dispatch, getState) => {
    const state = getState();
    const sourceNs = state.namespace;
    const sourcePipeline = makeViewPipeline(state.pipeline);

    const meta = {
      source: sourceNs,
      pipeline: sourcePipeline
    };

    debug('emitting', 'open-create-view', meta);
    dispatch(localAppRegistryEmit('open-create-view', meta));
  };
};

/**
 * Action creator for modifying a view.
 *
 * @param {String} viewName - The view name.
 * @param {Array} viewPipeline - The view pipeline.
 * @param {Boolean} readonly - Is read only.
 * @param {String} source - The source name.
 *
 * @returns {Object} The action.
 */
export const modifyView = (
  viewName: string,
  viewPipeline: Pipeline[],
  readonly: boolean,
  source: string
): ThunkAction<void, RootState, void, AnyAction> => {
  return (dispatch) => {
    dispatch(modifySource(viewName, viewPipeline, readonly, source));
    dispatch(runStage(0, true /* force execute */));
  };
};

export const modifySource = (
  viewName: string,
  viewPipeline: unknown,
  readonly: boolean,
  source: string
) => ({
  type: MODIFY_VIEW,
  name: viewName,
  pipeline: viewPipeline,
  isReadonly: readonly,
  sourceName: source
});
