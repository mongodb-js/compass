import { toJSString as toShellString, parseFilter } from 'mongodb-query-parser';
import bson from 'bson';
import compiler from 'bson-compilers';

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
 * Create a pipeline from the provided text.
 *
 * @param {String} text - The text.
 *
 * @returns {Array} The pipeline for the builder.
 */
export default function createPipeline(text) {
  try {
    const jsText = compiler[SHELL][JS].compile(text);
    const js = parseFilter(jsText);
    return js.map((stage) => {
      console.log(stage);
      console.log(Object.values(stage)[0]);
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
}
