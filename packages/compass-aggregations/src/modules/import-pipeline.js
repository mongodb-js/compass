import { toJSString } from 'mongodb-query-parser';
import { emptyStage } from './pipeline';
import { extractStages } from './extract-stages';
const debug = require('debug')('mongodb-aggregations:modules:import-pipeline');

/**
 * Shell string indent.
 */
const INDENT = '  ';

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

const MAPPINGS = {
  [NEW_PIPELINE_FROM_TEXT]: onNewPipelineFromText,
  [CLOSE_IMPORT]: onCloseImport,
  [CHANGE_TEXT]: onChangeText,
  [CREATE_NEW]: onCreateNew
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
 * @returns {Object} The action.
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
 * Confirm new action creator.
 *
 * @returns {Object} The state.
 */
export const confirmNew = () => ({
  type: CONFIRM_NEW
});

/**
 * Create a pipeline from the provided text.
 *
 * @param {String} text - The text.
 *
 * @returns {Array} The pipeline for the builder.
 */
export const createPipeline = (text) => {
  try {
    const stages = extractStages(text);
    return stages.map((stage) => {
      return createStage(
        stage.operator,
        stage.source,
        null
      );
    });
  } catch (jsError) {
    debug(jsError);
    return [ createStage(null, '', jsError.message) ];
  }
};

export const createPipelineFromView = (pipeline) => {
  return pipeline.map((stage) => {
    return createStage(
      Object.keys(stage)[0],
      toJSString(Object.values(stage)[0], INDENT),
      null
    );
  });
};

/**
 * Create a single stage in the pipeline.
 *
 * @param {String} stageOperator - The stage operator.
 * @param {String} stage - The stage.
 * @param {String} syntaxError - The syntax error.
 *
 * @returns {Object} The stage.
 */
export const createStage = (stageOperator, stage, syntaxError) => {
  const newStage = emptyStage();
  return {
    ...newStage,
    stageOperator: stageOperator,
    stage: stage,
    isValid: syntaxError ? false : true,
    syntaxError: syntaxError
  };
};
