import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { updatePipelinePreview } from './pipeline-builder/builder-helpers';

const { track } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

/**
 * New pipeline action name.
 */
export const NEW_PIPELINE = 'aggregations/NEW_PIPELINE';

/**
 * Action name prefix.
 */
const PREFIX = 'aggregations/import-pipeline';

/**
 * New pipeline from text action.
 */
export const NEW_PIPELINE_FROM_TEXT = `${PREFIX}/NEW_PIPELINE_FROM_TEXT`;

/**
 * Close import action name.
 */
export const CLOSE_IMPORT = `${PREFIX}/CLOSE_IMPORT`;

/**
 * Change text action name.
 */
export const CHANGE_TEXT = `${PREFIX}/CHANGE_TEXT`;

/**
 * Create new action name.
 */
export const CREATE_NEW = `${PREFIX}/CREATE_NEW`;

/**
 * Create new action name.
 */
export const CONFIRM_NEW = `${PREFIX}/CONFIRM_NEW`;

/**
 * The initial state.
 */
export const INITIAL_STATE = {
  isOpen: false,
  text: '',
  isConfirmationNeeded: false,
  syntaxError: null
};

/**
 * Handle new pipeline actions.
 *
 * @param {Object} state - The state.
 *
 * @returns {Object} The new state.
 */
const onNewPipelineFromText = (state) => ({
  ...state,
  isOpen: true,
  text: ''
});

/**
 * Handle close import actions.
 *
 * @param {Object} state - The state.
 *
 * @returns {Object} The new state.
 */
const onCloseImport = (state) => ({
  ...state,
  isOpen: false,
  isConfirmationNeeded: false,
  syntaxError: null
});

/**
 * Handle text change actions.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const onChangeText = (state, action) => ({
  ...state,
  text: action.text
});

/**
 * Handle on create new actions.
 *
 * @param {Object} state - The state.
 *
 * @returns {Object} The new state.
 */
const onCreateNew = (state) => ({
  ...state,
  isOpen: false,
  isConfirmationNeeded: true
});

const onConfirmNew = (state, { error }) => {
  return {
    isOpen: error ? true : false,
    isConfirmationNeeded: false,
    text: error ? state.text : '',
    syntaxError: error
  };
};

const onNewPipeline = () => ({ ...INITIAL_STATE });

const MAPPINGS = {
  [NEW_PIPELINE_FROM_TEXT]: onNewPipelineFromText,
  [CLOSE_IMPORT]: onCloseImport,
  [CHANGE_TEXT]: onChangeText,
  [CREATE_NEW]: onCreateNew,
  [CONFIRM_NEW]: onConfirmNew,
  [NEW_PIPELINE]: onNewPipeline
};

/**
 * The reducer.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {any} The state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  const fn = MAPPINGS[action.type];
  return fn ? fn(state, action) : state;
}

/**
 * New pipeline from text action.
 *
 * @returns {import("redux").AnyAction} The action.
 */
export const newPipelineFromText = () => ({
  type: NEW_PIPELINE_FROM_TEXT
});

/**
 * Close the import.
 *
 * @returns {Object} The action.
 */
export const closeImport = () => ({
  type: CLOSE_IMPORT
});

/**
 * Change text action creator.
 *
 * @param {String} text - The text.
 *
 * @returns {Object} the action.
 */
export const changeText = (text) => ({
  type: CHANGE_TEXT,
  text: text
});

/**
 * Create new action creator.
 *
 * @returns {Object} the action.
 */
export const createNew = () => ({
  type: CREATE_NEW
});

/**
 * Confirm new pipeline action
 * 
 * @returns {import('.').PipelineBuilderThunkAction<void>}
 */
 export const newPipeline = () => (
  dispatch,
  _getState,
  { pipelineBuilder }
) => {
  pipelineBuilder.reset();
  dispatch({
    type: NEW_PIPELINE,
    stages: pipelineBuilder.stages,
    pipelineText: pipelineBuilder.source,
    pipeline: pipelineBuilder.pipeline,
    syntaxErrors: pipelineBuilder.syntaxError,
  });
};

/**
 * @returns {import('.').PipelineBuilderThunkAction<void>}
 */
export const confirmNew = () => (dispatch, getState, { pipelineBuilder }) => {
  const { importPipeline: { text } } = getState();

  pipelineBuilder.reset(text);

  const error = pipelineBuilder.syntaxError[0]?.message

  dispatch({
    type: CONFIRM_NEW,
    stages: pipelineBuilder.stages,
    pipelineText: pipelineBuilder.source,
    pipeline: pipelineBuilder.pipeline,
    syntaxErrors: pipelineBuilder.syntaxError,
    error,
  });

  if (!error) {
    dispatch(updatePipelinePreview());
    track('Aggregation Imported From Text', { num_stages: pipelineBuilder.stages.length });
  }
};
