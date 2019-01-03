const bson = require('bson');
const Context = require('context-eval');
const EJSON = require('mongodb-extended-json');
const javascriptStringify = require('javascript-stringify');

import { defaults, isEqual, pick } from 'lodash';

/**
 * The module action prefix.
 */
const PREFIX = 'validation';

/**
 * Validator changed action name.
 */
export const VALIDATOR_CHANGED = `${PREFIX}/VALIDATOR_CHANGED`;

/**
 * Validation canceled action name.
 */
export const VALIDATION_CANCELED = `${PREFIX}/VALIDATION_CANCELED`;

/**
 * Validation saved action name.
 */
export const VALIDATION_SAVED = `${PREFIX}/VALIDATION_SAVED`;

/**
 * Validation save failed action name.
 */
export const VALIDATION_SAVE_FAILED = `${PREFIX}/VALIDATION_SAVE_FAILED`;

/**
 * Validation fetched action name.
 */
export const VALIDATION_FETCHED = `${PREFIX}/VALIDATION_FETCHED`;

/**
 * Validation action changed action name.
 */
export const VALIDATION_ACTION_CHANGED = `${PREFIX}/VALIDATION_ACTION_CHANGED`;

/**
 * Validation level changed action name.
 */
export const VALIDATION_LEVEL_CHANGED = `${PREFIX}/VALIDATION_LEVEL_CHANGED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = {
  validator: '',
  validationAction: 'error',
  validationLevel: 'strict',
  isChanged: false,
  syntaxError: null,
  error: null
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
    NumberDecimal: bson.Decimal128.fromString,
    Double: bson.Double,
    Int32: bson.Int32,
    NumberInt: (s) => parseInt(s, 10),
    Long: bson.Long,
    NumberLong: bson.Long.fromNumber,
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
 * @param {Object} sandbox - The sandbox.
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
 * Check validator as a simple query.
 *
 * @param {String} validator - Validator.
 *
 * @returns {Boolean} Is validator correct.
 */
const checkValidator = (validator) => {
  const sandbox = getQuerySandbox();
  const validation = { syntaxError: null, validator };

  try {
    validation.validator = executeJavascript(validator, sandbox);
  } catch (error) {
    validation.syntaxError = error;
  }

  return validation;
};

/**
 * Change validator.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const changeValidator = (state, action) => {
  const checkedValidator = checkValidator(action.validator);
  const newState = {
    ...state,
    validator: action.validator,
    syntaxError: checkedValidator.syntaxError
  };

  return {
    ...newState,
    isChanged: !isEqual(
      pick(newState, ['validator', 'validationAction', 'validationLevel']),
      state.prevValidation
    )
  };
};

/**
 * Cancel validation changes.
 *
 * @param {Object} state - The state
 *
 * @returns {Object} The new state.
 */
const cancelValidation = (state) => ({
  ...state,
  isChanged: false,
  validator: state.prevValidation.validator,
  validationAction: state.prevValidation.validationAction,
  validationLevel: state.prevValidation.validationLevel,
  syntaxError: null,
  error: null
});

/**
 * Clears validation state after saving.
 *
 * @param {Object} state - The state
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const updateValidation = (state, action) => ({
  ...state,
  isChanged: action.isChanged,
  syntaxError: null,
  error: action.error ? action.error : null
});

/**
 * Set validation.
 *
 * @param {Object} state - The state
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const setValidation = (state, action) => {
  const checkedValidator = checkValidator(action.validation.validator);
  const validator = javascriptStringify(checkedValidator.validator, null, 2);

  return {
    ...state,
    isChanged: false,
    prevValidation: {
      validator,
      validationAction: action.validation.validationAction,
      validationLevel: action.validation.validationLevel
    },
    validator: validator,
    validationAction: action.validation.validationAction,
    validationLevel: action.validation.validationLevel,
    syntaxError: null,
    error: null
  };
};

/**
 * Change validation action.
 *
 * @param {Object} state - The state
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const changeValidationAction = (state, action) => {
  const newState = {
    ...state,
    validationAction: action.validationAction
  };

  return {
    ...newState,
    isChanged: !isEqual(
      pick(newState, ['validator', 'validationAction', 'validationLevel']),
      state.prevValidation
    )
  };
};

/**
 * Change validation level.
 *
 * @param {Object} state - The state
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const changeValidationLevel = (state, action) => {
  const newState = {
    ...state,
    validationLevel: action.validationLevel
  };

  return {
    ...newState,
    isChanged: !isEqual(
      pick(newState, ['validator', 'validationAction', 'validationLevel']),
      state.prevValidation
    )
  };
};

/**
 * To not have a huge switch statement in the reducer.
 */
const MAPPINGS = {
  [VALIDATOR_CHANGED]: changeValidator,
  [VALIDATION_CANCELED]: cancelValidation,
  [VALIDATION_FETCHED]: setValidation,
  [VALIDATION_SAVED]: updateValidation,
  [VALIDATION_SAVE_FAILED]: updateValidation,
  [VALIDATION_ACTION_CHANGED]: changeValidationAction,
  [VALIDATION_LEVEL_CHANGED]: changeValidationLevel
};

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
 * Action creator for validation action changed events.
 *
 * @param {String} validationAction - Validation action.
 *
 * @returns {Object} Validation action changed action.
 */
export const validationActionChanged = (validationAction) => ({
  type: VALIDATION_ACTION_CHANGED,
  validationAction
});

/**
 * Action creator for validation level changed events.
 *
 * @param {String} validationLevel - Validation level.
 *
 * @returns {Object} Validation level changed action.
 */
export const validationLevelChanged = (validationLevel) => ({
  type: VALIDATION_LEVEL_CHANGED,
  validationLevel
});

/**
 * Action creator for validator changed events.
 *
 * @param {String} validator - Validator.
 *
 * @returns {Object} Validator changed action.
 */
export const validatorChanged = (validator) => ({
  type: VALIDATOR_CHANGED,
  validator
});

/**
 * Action creator for validation fetched events.
 *
 * @param {String} validation - Validation.
 *
 * @returns {Object} Validation fetched action.
 */
export const validationFetched = (validation) => ({
  type: VALIDATION_FETCHED,
  validation
});

/**
 * Action creator for validation canceled events.
 *
 * @returns {Object} Validation canceled action.
 */
export const validationCanceled = () => ({
  type: VALIDATION_CANCELED
});

/**
 * Action creator for validation saved events.
 *
 * @param {Object} validation - Validation.
 *
 * @returns {Object} Validation saved action.
 */
export const validationSaved = (validation) => ({
  type: VALIDATION_SAVED,
  isChanged: false,
  validation
});

/**
 * Action creator for validation save failed events.
 *
 * @param {Object} error - Error value.
 *
 * @returns {Object} Validation save failed action.
 */
export const validationSaveFailed = (error) => ({
  type: VALIDATION_SAVE_FAILED,
  isChanged: true,
  error
});

/**
 * Fetch validation.
 *
 * @param {Object} namespace - Namespace.
 *
 * @returns {Function} The function.
 */
export const fetchValidation = (namespace) => {
  return (dispatch, getState) => {
    const state = getState();
    const dataService = state.dataService.dataService;

    if (dataService) {
      dataService.listCollections(
        namespace.database,
        { name: namespace.collection },
        (error, data) => {
          const options = data[0].options;
          let validation = {
            validator: INITIAL_STATE.validator,
            validationAction: INITIAL_STATE.validationAction,
            validationLevel: INITIAL_STATE.validationLevel
          };

          if (!error && options) {
            const validator = options.validator
              ? EJSON.stringify(options.validator, null, 2)
              : {};

            validation = defaults(
              {
                validator,
                validationAction: options.validationAction,
                validationLevel: options.validationLevel
              },
              validation
            );
          }

          return dispatch(validationFetched(validation));
        }
      );
    }
  };
};

/**
 * Save validation.
 *
 * @param {Object} validation - Validation.
 *
 * @returns {Function} The function.
 */
export const saveValidation = (validation) => {
  return (dispatch, getState) => {
    const state = getState();
    const dataService = state.dataService.dataService;
    const namespace = state.namespace;
    const checkedValidator = checkValidator(validation.validator);

    if (dataService) {
      dataService.updateCollection(
        namespace.database,
        {
          collMod: namespace.collection,
          validator: checkedValidator.validator,
          validationAction: validation.validationAction,
          validationLevel: validation.validationLevel
        },
        (error) => {
          if (!error) {
            return dispatch(validationSaved(validation));
          }

          return dispatch(validationSaveFailed(error));
        }
      );
    }
  };
};
