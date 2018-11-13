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
 * Validation changes canceled action name.
 */
export const VALIDATION_CHANGES_CANCELED = `${PREFIX}/VALIDATION_CHANGES_CANCELED`;

/**
 * Validation changes saved action name.
 */
export const VALIDATION_CHANGES_SAVED = `${PREFIX}/VALIDATION_CHANGES_SAVED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = {
  validationRules: '',
  validationChanged: false,
  syntaxError: null
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
  const validatedRules = {input, syntaxError: null};
  const sandbox = getQuerySandbox();

  try {
    validatedRules.input = EJSON.stringify(executeJavascript(input, sandbox));
    validatedRules.syntaxError = queryLanguage.accepts(validatedRules.input)
      ? null
      : 'MongoDB language model does not accept the input';
  } catch (error) {
    validatedRules.syntaxError = error;
  }

  return validatedRules;
};

/**
 * Change validation rules.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const changeValidationRules = (state, action) => {
  const newState = {...state};
  const validatedRules = validateRules(action.validationRules);

  newState.validationChanged = true;
  newState.validationRules = validatedRules.input;
  newState.syntaxError = validatedRules.syntaxError;

  return newState;
};

/**
 * Cancel validation changes.
 *
 * @param {Object} state - The state
 *
 * @returns {Object} The new state.
 */
const cancelValidationChanges = (state) => {
  const newState = {...state};

  newState.validationChanged = false;
  newState.validationRules = ''; // TODO: Read validation from the collection to get old values.
  newState.syntaxError = null;

  return newState;
};

/**
 * Cancel validation changes.
 *
 * @param {Object} state - The state
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const saveValidationChanges = (state, action) => {
  const newState = {...state};

  newState.validationChanged = false;
  newState.validationRules = action.validationRules;
  newState.syntaxError = null;

  // TODO: Save validation to the collection.

  return newState;
};

/**
 * To not have a huge switch statement in the reducer.
 */
const MAPPINGS = {};

MAPPINGS[VALIDATION_RULES_CHANGED] = changeValidationRules;
MAPPINGS[VALIDATION_CHANGES_CANCELED] = cancelValidationChanges;
MAPPINGS[VALIDATION_CHANGES_SAVED] = saveValidationChanges;

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

/**
 * Action creator for validation changes canceled events.
 *
 * @returns {Object} Validation changes canceled action.
 */
export const validationChangesCanceled = () => ({
  type: VALIDATION_CHANGES_CANCELED
});

/**
 * Action creator for validation changes saved events.
 *
 * @param {String} value - Validation rules.
 *
 * @returns {Object} Validation changes saved action.
 */
export const validationChangesSaved = (validationRules) => ({
  type: VALIDATION_CHANGES_SAVED,
  validationRules
});
