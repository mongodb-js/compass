import { EJSON } from 'bson';
import queryParser from 'mongodb-query-parser';
import { stringify as javascriptStringify } from 'javascript-stringify';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { clearSampleDocuments } from './sample-documents';
import { zeroStateChanged } from './zero-state';
import { isLoadedChanged } from './is-loaded';
import { globalAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';
import { isEqual, pick, isObject } from 'lodash';

const { track } = createLoggerAndTelemetry('COMPASS-SCHEMA-VALIDATION-UI');

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
  error: null,
};

/**
 * Check validator as a simple query.
 * @typedef {Object} Validator
 * @property {string} syntaxError - The validation error
 * @property {Object} validator - Parsed validation object
 *
 * @param {String} validator - Validator.
 *
 * @returns {Validator}
 */
export const checkValidator = (validator) => {
  const validation = { syntaxError: null, validator };

  if (validator === '') {
    validation.syntaxError = {
      message: 'The validator must be an object.',
    };
  } else {
    try {
      validation.validator = queryParser.parseFilter(validator);
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
    error: null,
  };

  return {
    ...newState,
    isChanged: !isEqual(
      pick(newState, ['validator', 'validationAction', 'validationLevel']),
      state.prevValidation
    ),
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
  syntaxError: action.syntaxError,
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
      validationLevel: action.validation.validationLevel,
    },
    isChanged: action.validation.isChanged || false,
    validator: validator,
    validationAction: action.validation.validationAction,
    validationLevel: action.validation.validationLevel,
    syntaxError: null,
    error: action.validation.error || null,
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
    error: action.error || null,
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
    validationAction: action.validationAction,
  };

  return {
    ...newState,
    isChanged: !isEqual(
      pick(newState, ['validator', 'validationAction', 'validationLevel']),
      state.prevValidation
    ),
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
    validationLevel: action.validationLevel,
  };

  return {
    ...newState,
    isChanged: !isEqual(
      pick(newState, ['validator', 'validationAction', 'validationLevel']),
      state.prevValidation
    ),
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
  [SYNTAX_ERROR_OCCURRED]: setSyntaxError,
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
  validationAction,
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
  validationLevel,
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
  validator,
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
  validation,
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
  validation,
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
  error,
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
  syntaxError,
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
const sendMetrics = (
  dispatch,
  dataService,
  namespace,
  validation,
  registryEvent
) =>
  dataService.database(namespace.database, {}, (errorDB, res) => {
    let collectionSize = 0;
    let ruleCount = 0;
    let validator = validation.validator;

    if (!errorDB) {
      const collection = res.collections.find(
        (coll) => coll.name === namespace.collection
      );

      collectionSize = collection.document_count;
    }

    try {
      if (!isObject(validator)) {
        validator = queryParser.parseFilter(validator);
      }

      ruleCount = Object.keys(validator).length;
    } catch (error) {
      // In case of a parsing error set ruleCount to -1 to indicate the problem
      ruleCount = -1;
    }

    return dispatch(
      globalAppRegistryEmit(registryEvent, {
        ruleCount,
        validationLevel: validation.validationLevel,
        validationAction: validation.validationAction,
        jsonSchema: !!validator.$jsonSchema,
        collectionSize,
      })
    );
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

    if (!dataService) {
      return;
    }

    dataService.collectionInfo(namespace.database, namespace.collection).then(
      (collInfo) => {
        const validation = validationFromCollection(null, collInfo ?? {});

        if (!validation.validator) {
          validation.validator = '{}';
          dispatch(validationFetched(validation));
          dispatch(isLoadedChanged(true));
          return;
        }

        sendMetrics(
          dispatch,
          dataService,
          namespace,
          validation,
          'schema-validation-fetched'
        );

        validation.validator = EJSON.stringify(validation.validator, null, 2);

        dispatch(validationFetched(validation));
        dispatch(zeroStateChanged(false));
        dispatch(isLoadedChanged(true));
      },
      (err) => {
        dispatch(validationFetched(validationFromCollection(err)));
        dispatch(zeroStateChanged(false));
        dispatch(isLoadedChanged(true));
      }
    );
  };
};

export function validationFromCollection(err, { validation } = {}) {
  const { validationAction, validationLevel } = INITIAL_STATE;
  if (err) {
    return { validationAction, validationLevel, error: err };
  }
  return {
    validationAction: validation?.validationAction ?? validationAction,
    validationLevel: validation?.validationLevel ?? validationLevel,
    ...(validation?.validator && {
      validator: validation.validator,
    }),
  };
}

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
      isChanged: false,
    };

    if (dataService) {
      const trackEvent = {
        validation_action: validation.validationAction,
        validation_level: validation.validationLevel,
      };
      track('Schema Validation Updated', trackEvent);
      sendMetrics(
        dispatch,
        dataService,
        namespace,
        validation,
        'schema-validation-saved'
      );
      dataService.updateCollection(
        `${namespace.database}.${namespace.collection}`,
        {
          validator: savedValidation.validator,
          validationAction: savedValidation.validationAction,
          validationLevel: savedValidation.validationLevel,
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

    dispatch(
      validationCanceled({
        isChanged: false,
        validator: prevValidation.validator,
        validationAction: prevValidation.validationAction,
        validationLevel: prevValidation.validationLevel,
        syntaxError: null,
        error: null,
      })
    );
    dispatch(clearSampleDocuments());

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
    const namespace = state.namespace;

    dispatch(fetchValidation(namespace));

    const dataService = state.dataService.dataService;
    const validation = state.validation; // this is almost certainly still the initial state

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
