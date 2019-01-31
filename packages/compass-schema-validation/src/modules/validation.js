import bson from 'bson';
import Context from 'context-eval';
import EJSON from 'mongodb-extended-json';
import javascriptStringify from 'javascript-stringify';
import { fetchSampleDocuments } from './sample-documents';
import { zeroStateChanged } from './zero-state';
import { appRegistryEmit } from 'modules/app-registry';

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
* Syntax error occurred action name.
*/
export const SYNTAX_ERROR_OCCURRED = `${PREFIX}/SYNTAX_ERROR_OCCURRED`;

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
export const checkValidator = (validator) => {
  const sandbox = getQuerySandbox();
  const validation = { syntaxError: null, validator };

  if (validator === '') {
    validation.syntaxError = {
      message: 'The validator must be an object.'
    };
  } else {
    try {
      validation.validator = executeJavascript(validator, sandbox);
    } catch (error) {
      validation.syntaxError = error;
    }
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
    syntaxError: checkedValidator.syntaxError,
    error: null
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
* Sets syntax error.
*
* @param {Object} state - The state
* @param {Object} action - The action.
*
* @returns {Object} The new state.
*/
const setSyntaxError = (state, action) => ({
  ...state,
  isChanged: true,
  syntaxError: action.syntaxError
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
    prevValidation: {
      validator,
      validationAction: action.validation.validationAction,
      validationLevel: action.validation.validationLevel
    },
    isChanged: action.validation.isChanged || false,
    validator: validator,
    validationAction: action.validation.validationAction,
    validationLevel: action.validation.validationLevel,
    syntaxError: null,
    error: action.validation.error || null
  };
};

/**
 * Set Error.
 *
 * @param {Object} state - The state
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const setError = (state, action) => {
  return {
    ...state,
    error: action.error || null
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
  [VALIDATION_CANCELED]: setValidation,
  [VALIDATION_FETCHED]: setValidation,
  [VALIDATION_SAVE_FAILED]: setError,
  [VALIDATION_ACTION_CHANGED]: changeValidationAction,
  [VALIDATION_LEVEL_CHANGED]: changeValidationLevel,
  [SYNTAX_ERROR_OCCURRED]: setSyntaxError
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
 * @param {String} validation - Validation.
 *
 * @returns {Object} Validation canceled action.
 */
export const validationCanceled = (validation) => ({
  type: VALIDATION_CANCELED,
  validation
});

/**
 * Action creator for validation save failed events.
 *
 * @param {Object} error - Error.
 *
 * @returns {Object} Validation save failed action.
 */
export const validationSaveFailed = (error) => ({
  type: VALIDATION_SAVE_FAILED,
  error
});

/**
 * Action creator for syntax error occurred events.
 *
 * @param {Object} syntaxError - Syntax error value.
 *
 * @returns {Object} Syntax error occurred action.
 */
export const syntaxErrorOccurred = (syntaxError) => ({
  type: SYNTAX_ERROR_OCCURRED,
  syntaxError
});

/**
 * Send metrics.
 *
 * @param {Function} dispatch - Dispatch.
 * @param {Object} dataService - Data service.
 * @param {Object} namespace - Namespace.
 * @param {Object} validation - Validation.
 * @param {String} registryEvent - Registry event.
 *
 * @returns {Function} The function.
 */
const sendMetrics = (dispatch, dataService, namespace, validation, registryEvent) => dataService
  .database(namespace.database, {}, (errorDB, res) => {
    let collectionSize = 0;

    if (!errorDB) {
      const collection = res.collections.find((coll) => (
        coll.name === namespace.collection
      ));

      collectionSize = collection.document_count;
    }

    return dispatch(appRegistryEmit(
      registryEvent,
      {
        ruleCount: Object.keys(validation.validator).length,
        validationLevel: validation.validationLevel,
        validationAction: validation.validationAction,
        jsonSchema: (validation.validator.indexOf('$jsonSchema') !== -1),
        collectionSize
      }
    ));
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
    let validation = {
      validationAction: INITIAL_STATE.validationAction,
      validationLevel: INITIAL_STATE.validationLevel
    };


    if (dataService) {
      dataService.listCollections(
        namespace.database,
        { name: namespace.collection },
        (errorColl, data) => {
          if (errorColl) {
            validation.error = errorColl;

            dispatch(zeroStateChanged());
            dispatch(validationFetched(validation));

            return;
          }

          const options = data[0].options;

          if (options) {
            validation = defaults(
              {
                validator: options.validator,
                validationAction: options.validationAction,
                validationLevel: options.validationLevel
              },
              validation
            );
          }

          if (validation.validator) {
            validation.validator = EJSON.stringify(options.validator, null, 2);

            dispatch(zeroStateChanged());
            dispatch(fetchSampleDocuments(validation.validator));
            dispatch(validationFetched(validation));

            sendMetrics(
              dispatch,
              dataService,
              namespace,
              validation,
              'schema-validation-fetched'
            );

            return;
          }

          validation.validator = '{}';

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
    const savedValidation = {
      validator: checkedValidator.validator,
      validationAction: validation.validationAction,
      validationLevel: validation.validationLevel,
      isChanged: false
    };

    if (dataService) {
      sendMetrics(
        dispatch,
        dataService,
        namespace,
        validation,
        'schema-validation-saved'
      );
      dataService.updateCollection(
        namespace.database,
        {
          collMod: namespace.collection,
          validator: savedValidation.validator,
          validationAction: savedValidation.validationAction,
          validationLevel: savedValidation.validationLevel
        },
        (error) => {
          if (error) {
            return dispatch(validationSaveFailed(error));
          }

          return dispatch(fetchValidation(namespace));
        }
      );
    }
  };
};

/**
 * Cancel validation.
 *
 * @returns {Function} The function.
 */
export const cancelValidation = () => {
  return (dispatch, getState) => {
    const state = getState();
    const prevValidation = state.validation.prevValidation;

    dispatch(validationCanceled({
      isChanged: false,
      validator: prevValidation.validator,
      validationAction: prevValidation.validationAction,
      validationLevel: prevValidation.validationLevel,
      syntaxError: null,
      error: null
    }));
    dispatch(fetchSampleDocuments(prevValidation.validator));

    return;
  };
};

/**
* Activate validation.
*
* @returns {Function} The function.
*/
export const activateValidation = () => {
  return (dispatch, getState) => {
    const state = getState();
    const dataService = state.dataService.dataService;
    const namespace = state.namespace;
    const validation = state.validation;

    if (dataService) {
      sendMetrics(
        dispatch,
        dataService,
        namespace,
        validation,
        'schema-validation-activated'
      );
    }
  };
};
