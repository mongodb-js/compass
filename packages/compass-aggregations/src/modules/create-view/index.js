import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { track, debug } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

import { combineReducers } from 'redux';
import dataService from '../data-service';

import source, {
  INITIAL_STATE as SOURCE_INITIAL_STATE
} from '../create-view/source';

import pipeline, {
  INITIAL_STATE as PIPELINE_INITIAL_STATE
} from '../create-view/pipeline';

import isRunning, {
  toggleIsRunning,
  INITIAL_STATE as IS_RUNNING_INITIAL_STATE
} from '../create-view/is-running';
import isVisible, {
  INITIAL_STATE as IS_VISIBLE_INITIAL_STATE
} from '../create-view/is-visible';
import isDuplicating, {
  INITIAL_STATE as IS_DUPLICATING_INITIAL_STATE
} from '../create-view/is-duplicating';
import name, {
  INITIAL_STATE as NAME_INITIAL_STATE
} from '../create-view/name';

import error, {
  clearError,
  handleError,
  INITIAL_STATE as ERROR_INITIAL_STATE
} from '../create-view/error';

import { reset, RESET } from '../create-view/reset';
import appRegistry, {
  globalAppRegistryEmit
} from '@mongodb-js/mongodb-redux-common/app-registry';
import { mapPipelineModeToEditorViewType } from '../pipeline-builder/builder-helpers';

const parseNs = require('mongodb-ns');

/**
 * Open action name.
 */
const OPEN = 'aggregations/create-view/OPEN';

export const INITIAL_STATE = {
  isRunning: IS_RUNNING_INITIAL_STATE,
  isVisible: IS_VISIBLE_INITIAL_STATE,
  isDuplicating: IS_DUPLICATING_INITIAL_STATE,
  name: NAME_INITIAL_STATE,
  error: ERROR_INITIAL_STATE,
  source: SOURCE_INITIAL_STATE,
  pipeline: PIPELINE_INITIAL_STATE
};

/**
 * The main reducer.
 */
const reducer = combineReducers({
  appRegistry,
  isRunning,
  isDuplicating,
  isVisible,
  name,
  error,
  source,
  pipeline,
  dataService
});

/**
 * The root reducer.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const rootReducer = (state, action) => {
  if (action.type === RESET) {
    return {
      ...state,
      ...INITIAL_STATE
    };
  } else if (action.type === OPEN) {
    const newState = {
      ...state,
      ...INITIAL_STATE,
      isVisible: true,
      isDuplicating: action.duplicate,
      source: action.source,
      pipeline: action.pipeline
    };

    debug('handling open', { newState });

    return newState;
  }
  return reducer(state, action);
};

export default rootReducer;

/**
 * Stop progress and set the error.
 *
 * @param {Function} dispatch - The dispatch function.
 * @param {Error} err - The error.
 *
 * @return {Object} The result.
 */
const stopWithError = (dispatch, err) => {
  dispatch(toggleIsRunning(false));
  return dispatch(handleError(err));
};

/**
 * Open create view action creator.
 *
 * @param {String} sourceNs - The source namespace for the view.
 * @param {Array} sourcePipeline - The pipeline to use for the view.
 * @returns {Object} The action.
 */
export const open = (sourceNs, sourcePipeline, duplicate) => ({
  type: OPEN,
  source: sourceNs,
  pipeline: sourcePipeline,
  duplicate: duplicate
});

/**
 * The create view action.
 *
 * @returns {Function} The thunk function.
 */
export const createView = () => {
  return (dispatch, getState) => {
    debug('creating view!');
    const state = getState();
    const ds = state.dataService.dataService;

    const viewName = state.name;
    const viewSource = state.source;
    const { database } = parseNs(state.source);
    const viewPipeline = state.pipeline;
    const options = {};

    dispatch(clearError());

    try {
      dispatch(toggleIsRunning(true));
      debug('calling data-service.createView', viewName, viewSource, viewPipeline, options);
      ds.createView(viewName, viewSource, viewPipeline, options, (e) => {
        if (e) {
          debug('error creating view', e);
          return stopWithError(dispatch, e);
        }
        debug('View created!');
        track('Aggregation Saved As View', {
          num_stages: viewPipeline.length,
          editor_view_type: mapPipelineModeToEditorViewType(state.pipelineBuilder.pipelineMode),
        });
        dispatch(
          globalAppRegistryEmit(
            'compass:aggregations:create-view',
            { numStages: viewPipeline.length }
          )
        );
        dispatch(
          globalAppRegistryEmit(
            'aggregations-open-result-namespace',
            `${database}.${viewName}`
          )
        );
        dispatch(reset());
      });
    } catch (e) {
      debug('Unexpected error creating view', e);
      return stopWithError(dispatch, e);
    }
  };
};
