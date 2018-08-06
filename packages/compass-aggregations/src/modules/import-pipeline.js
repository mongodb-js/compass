import { toJSString as toShellString } from 'mongodb-query-parser';
import bson from 'bson';
import compiler from 'bson-compilers';
import Context from 'context-eval';

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
 * Sanbox for converting the JS string to JS object.
 */
const SANDBOX = {
  RegExp: RegExp,
  Code: function(c, s) {
    return new bson.Code(c, s);
  },
  DBRef: bson.DBRef,
  Decimal128: bson.Decimal128,
  NumberDecimal: bson.NumberDecimal,
  NumberInt: bson.Int32,
  NumberLong: bson.NumberLong,
  Map: bson.Map,
  MaxKey: bson.MaxKey,
  MinKey: bson.MinKey,
  ObjectID: bson.ObjectID,
  ObjectId: bson.ObjectID,
  Symbol: bson.Symbol,
  Timestamp: bson.Timestamp,
  ISODate: function(s) {
    return new Date(s);
  },
  Date: function(s) {
    return new Date(s);
  }
};

/**
 * Execute the provided JS text in a context and return the result.
 *
 * @param {String} text - The text.
 *
 * @returns {Object} The JS object.
 */
const executeJS = (text) => {
  const sandbox = { __result: {}, ...SANDBOX };
  const ctx = new Context(sandbox);
  const result = ctx.evaluate('__result = ' + text);
  ctx.destroy();
  return result;
};

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
    const js = executeJS(jsText);
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
}
