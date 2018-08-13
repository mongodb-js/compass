import { toJSString as toShellString, parseFilter } from 'mongodb-query-parser';
import bson from 'bson';
import transpiler from 'bson-transpilers';

/**
 * JS lang constant.
 */
const JS = 'javascript';

/**
 * Shell lang constant.
 */
const SHELL = 'shell';

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
  isConfirmationNeeded: false
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
  isConfirmationNeeded: false
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
 * @returns {Object} The state.
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
    const jsText = transpiler[SHELL][JS].compile(text);
    const js = parseFilter(jsText);
    return js.map((stage) => {
      return createStage(
        Object.keys(stage)[0],
        toShellString(Object.values(stage)[0], INDENT),
        null
      );
    });
  } catch (e) {
    return [ createStage(null, '', e.message) ];
  }
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
const createStage = (stageOperator, stage, syntaxError) => ({
  id: new bson.ObjectId().toHexString(),
  stageOperator: stageOperator,
  stage: stage,
  isValid: syntaxError ? false : true,
  isEnabled: true,
  isExpanded: true,
  isLoading: false,
  isComplete: false,
  previewDocuments: [],
  syntaxError: syntaxError,
  error: null
});
