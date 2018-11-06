const bson = require('bson');
const Context = require('context-eval');
const EJSON = require('mongodb-extended-json');
const queryLanguage = require('mongodb-language-model');

/**
 * The module action prefix.
 */
const PREFIX = 'validation';

/**
 * Validation rules changed action name.
 */
export const VALIDATION_RULES_CHANGED = `${PREFIX}/VALIDATION_RULES_CHANGED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = {
  validationRules: '',
  syntaxError: false
};

/**
 * Create the sandbox object with BSON types support.
 *
 * @returns {Object} The sandbox object.
 */
function getQuerySandbox() {
  return {
    RegExp: RegExp,
    Binary: bson.Binary,
    Code: function(c, s) {
      return new bson.Code(c, s);
    },
    DBRef: bson.DBRef,
    Decimal128: bson.Decimal128,
    NumberDecimal: function(s) {
      return bson.Decimal128.fromString(s);
    },
    Double: bson.Double,
    Int32: bson.Int32,
    NumberInt: function(s) {
      return parseInt(s, 10);
    },
    Long: bson.Long,
    NumberLong: function(v) {
      return bson.Long.fromNumber(v);
    },
    Int64: bson.Long,
    Map: bson.Map,
    MaxKey: bson.MaxKey,
    MinKey: bson.MinKey,
    ObjectID: bson.ObjectID,
    ObjectId: bson.ObjectID,
    Symbol: bson.Symbol,
    Timestamp: function(low, high) {
      return new bson.Timestamp(low, high);
    },
    ISODate: function(s) {
      return new Date(s);
    },
    Date: function(s) {
      return new Date(s);
    }
  };
}

/**
 * Execute JS to parse the query string.
 *
 * @param {String} input - Validation rules.
 * @param {Object} sandbox - The sandbox object.
 *
 * @returns {Object} The parsed query.
 */
function executeJavascript(input, sandbox) {
  sandbox = sandbox || {};
  sandbox.__result = {};

  const ctx = new Context(sandbox);
  const res = ctx.evaluate('__result = ' + input);
  ctx.destroy();

  return res;
}

/**
 * Validate rules as simple query.
 *
 * @param {String} state - Validation rules.
 *
 * @returns {Boolean} Is rules valid.
 */
const validateRules = (input) => {
  try {
    const sandbox = getQuerySandbox();
    const parsedInput = executeJavascript(input, sandbox);

    // is it a valid MongoDB query according to the language?
    return !queryLanguage.accepts(EJSON.stringify(parsedInput));
  } catch (e) {
    return true;
  }
};

/**
 * Change stage value.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const changeValidationRules = (state, action) => {
  const newState = {...state};

  newState.validationRules = action.validationRules;
  newState.syntaxError = validateRules(newState.validationRules);

  return newState;
};

/**
 * To not have a huge switch statement in the reducer.
 */
const MAPPINGS = {};

MAPPINGS[VALIDATION_RULES_CHANGED] = changeValidationRules;

/**
 * Reducer function for handle state changes to status.
 *
 * @param {String} state - The status state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  const fn = MAPPINGS[action.type];
  return fn ? fn(state, action) : state;
}

/**
 * Action creator for validation rules changed events.
 *
 * @param {String} value - Validation rules.
 *
 * @returns {Object} Validation rules changed action.
 */
export const validationRulesChanged = (validationRules) => ({
  type: VALIDATION_RULES_CHANGED,
  validationRules
});
