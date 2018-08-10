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
 * The initial state.
 */
export const INITIAL_STATE = {
  isOpen: false
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
  if (action === NEW_PIPELINE_FROM_TEXT) {
    return { isOpen: true };
  }
  return state;
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
      return {
        id: new bson.ObjectId().toHexString(),
        stageOperator: Object.keys(stage)[0],
        stage: toShellString(Object.values(stage)[0], INDENT),
        isValid: true,
        isEnabled: true,
        isExpanded: true,
        isLoading: false,
        isComplete: false,
        previewDocuments: [],
        syntaxError: null,
        error: null
      };
    });
  } catch (e) {
    return [{
      id: new bson.ObjectId().toHexString(),
      stageOperator: null,
      stage: '',
      isValid: false,
      isEnabled: true,
      isExpanded: true,
      isLoading: false,
      isComplete: false,
      previewDocuments: [],
      syntaxError: e.message,
      error: null
    }];
  }
};
