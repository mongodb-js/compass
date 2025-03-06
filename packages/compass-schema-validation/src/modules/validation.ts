import type { RootAction, RootState, SchemaValidationThunkAction } from '.';
import { EJSON } from 'bson';
import { parseFilter } from 'mongodb-query-parser';
import { stringify as javascriptStringify } from 'javascript-stringify';
import { clearSampleDocuments } from './sample-documents';
import { zeroStateChanged } from './zero-state';
import { isLoadedChanged } from './is-loaded';
import { isEqual, pick } from 'lodash';
import type { ThunkDispatch } from 'redux-thunk';
import { disableEditRules } from './edit-mode';

export type ValidationServerAction = 'error' | 'warn';
export type ValidationLevel = 'off' | 'moderate' | 'strict';

/**
 * The module action prefix.
 */
const PREFIX = 'validation' as const;

const VALIDATION_TEMPLATE = `/**
 * This is a starter template for a schema validation rule for a collection.
 * More information on schema validation rules can be found at:
 * https://www.mongodb.com/docs/manual/core/schema-validation/
 */
{ 
	$jsonSchema: {
		title: "Library.books", 
		bsonType: "object", 
		required: ["fieldname1", "fieldname2"],
		properties: {
			fieldname1: { 
				bsonType: "string",
				description: "Fieldname1 must be a string",
			},
fieldname2: { 
				bsonType: "int",
				description: "Fieldname2 must be an integer",
			}, 
			arrayFieldName: {
				bsonType: "array",
				items: {
bsonType: "string"
},
description: "arrayFieldName must be an array of strings"
			},
		}
	}
}
`;

/**
 * Validator changed action name.
 */
export const VALIDATOR_CHANGED = `${PREFIX}/VALIDATOR_CHANGED` as const;
interface ValidatorChangedAction {
  type: typeof VALIDATOR_CHANGED;
  validator: string;
}

/**
 * Validation canceled action name.
 */
export const VALIDATION_CANCELED = `${PREFIX}/VALIDATION_CANCELED` as const;
interface ValidationCanceledAction {
  type: typeof VALIDATION_CANCELED;
  validation: Validation;
}

/**
 * Validation save failed action name.
 */
export const VALIDATION_SAVE_FAILED =
  `${PREFIX}/VALIDATION_SAVE_FAILED` as const;
interface ValidationSaveFailedAction {
  type: typeof VALIDATION_SAVE_FAILED;
  error: Error;
}

/**
 * Validation fetched action name.
 */
export const VALIDATION_FETCHED = `${PREFIX}/VALIDATION_FETCHED` as const;
interface ValidationFetchedAction {
  type: typeof VALIDATION_FETCHED;
  validationAction: Validation['validationAction'];
  validationLevel: Validation['validationLevel'];
  validator: Validation['validator'];
}

/**
 * Validation action changed action name.
 */
export const VALIDATION_ACTION_CHANGED =
  `${PREFIX}/VALIDATION_ACTION_CHANGED` as const;
interface ValidationActionChangedAction {
  type: typeof VALIDATION_ACTION_CHANGED;
  validationAction: ValidationServerAction;
}

/**
 * Validation action changed action name.
 */
export const SET_VALIDATION_TO_DEFAULT =
  `${PREFIX}/SET_VALIDATION_TO_DEFAULT` as const;
interface SetValidationDefaultAction {
  type: typeof SET_VALIDATION_TO_DEFAULT;
}

const VALIDATION_FETCH_ERRORED = `${PREFIX}/VALIDATION_FETCH_ERRORED` as const;
interface ValidationFetchErroredAction {
  type: typeof VALIDATION_FETCH_ERRORED;
  error: Error;
}

/**
 * Validation level changed action name.
 */
export const VALIDATION_LEVEL_CHANGED =
  `${PREFIX}/VALIDATION_LEVEL_CHANGED` as const;
interface ValidationLevelChangedAction {
  type: typeof VALIDATION_LEVEL_CHANGED;
  validationLevel: ValidationLevel;
}

export type ValidationAction =
  | ValidatorChangedAction
  | ValidationCanceledAction
  | ValidationSaveFailedAction
  | ValidationFetchedAction
  | ValidationActionChangedAction
  | ValidationLevelChangedAction
  | SetValidationDefaultAction
  | ValidationFetchErroredAction;

export interface Validation {
  validator: string;
  validationAction: ValidationServerAction;
  validationLevel: ValidationLevel;
  isChanged?: boolean;
  error?: null | Error;
}

export interface ValidationState extends Validation {
  isChanged: boolean;
  syntaxError: null | Error;
  error: null | Error;
  prevValidation?: Validation;
}

/**
 * The initial state.
 */
export const INITIAL_STATE: ValidationState = {
  validator: VALIDATION_TEMPLATE,
  validationAction: 'error',
  validationLevel: 'strict',
  isChanged: false,
  syntaxError: null,
  error: null,
};

/**
 * Check validator as a simple query.
 */
export const checkValidator = (
  validator: string
): {
  syntaxError: null | Error;
  validator: Record<string, unknown> | string;
} => {
  const validation: {
    syntaxError: null | Error;
    validator: Record<string, unknown> | string;
  } = { syntaxError: null, validator };

  if (validator === '') {
    validation.syntaxError = {
      message: 'The validator must be an object.',
    };
  } else {
    try {
      parseFilter(validator);
    } catch (error) {
      validation.syntaxError = error as Error;
    }
  }

  return validation;
};

function checkValidatorForSyntaxError(validator: string): Error | null {
  if (validator === '') {
    return new Error('The validator must be an object.');
  } else {
    try {
      parseFilter(validator);
    } catch (error) {
      return error as Error;
    }
  }
  return null;
}

/**
 * Change validator.
 */
const changeValidator = (
  state: ValidationState,
  action: ValidatorChangedAction
): ValidationState => {
  // const checkedValidator = checkValidator(action.validator);
  const syntaxError = checkValidatorForSyntaxError(action.validator);

  return {
    ...state,
    validator: action.validator,
    syntaxError,
    error: null,
    isChanged: !isEqual(
      {
        validator: action.validator,
        validationAction: state.validationAction,
        validationLevel: state.validationLevel,
      },
      state.prevValidation
    ),
  };
};

const setValidationFetched = (
  state: ValidationState,
  action: ValidationFetchedAction
): ValidationState => {
  // const syntaxError = checkValidatorForSyntaxError(action.validation.validator);

  // const checkedValidator = checkValidator(action.validation.validator ?? '');
  // // TODO(COMPASS-4989): javascriptStringify??
  // const validator = javascriptStringify(
  //   checkedValidator.validator,
  //   null,
  //   2
  // ) as string;
  // validator = checkedValidator;

  return {
    ...state,
    prevValidation: {
      validator: action.validator,
      validationAction: action.validationAction,
      validationLevel: action.validationLevel,
    },
    isChanged: false,
    validator: action.validator,
    validationAction: action.validationAction,
    validationLevel: action.validationLevel,
    syntaxError: null,
    error: null,
  };
};

const setValidationCanceled = (
  state: ValidationState,
  action: ValidationCanceledAction
): ValidationState => {
  // const syntaxError = checkValidatorForSyntaxError(action.validation.validator);

  // const checkedValidator = checkValidator(action.validation.validator ?? '');
  // // TODO(COMPASS-4989): javascriptStringify??
  // const validator = javascriptStringify(
  //   checkedValidator.validator,
  //   null,
  //   2
  // ) as string;
  // validator = checkedValidator;

  return {
    ...state,
    prevValidation: {
      validator: action.validation.validator ?? '',
      validationAction: action.validation.validationAction,
      validationLevel: action.validation.validationLevel,
    },
    isChanged: action.validation.isChanged ?? false,
    validator: action.validation.validator ?? '',
    validationAction: action.validation.validationAction,
    validationLevel: action.validation.validationLevel,
    syntaxError: null,
    error: action.validation.error || null,
  };
};

const setValidationToDefault = (state: ValidationState): ValidationState => {
  return {
    ...state,
    prevValidation: {
      // Set it to an empty object to ensure future isChanged work properly.
      validator: '{}',
      validationAction: state.validationAction,
      validationLevel: state.validationLevel,
    },
    isChanged: true,
    validator: VALIDATION_TEMPLATE,
    validationAction: INITIAL_STATE.validationAction,
    validationLevel: INITIAL_STATE.validationLevel,
    syntaxError: null,
    error: null,
  };
};

const setValidationSaveErrored = (
  state: ValidationState,
  action: ValidationSaveFailedAction
): ValidationState => {
  return {
    ...state,
    error: action.error || null,
  };
};

/**
 * Change validation action.
 */
const changeValidationAction = (
  state: ValidationState,
  action: ValidationActionChangedAction
): ValidationState => {
  return {
    ...state,
    validationAction: action.validationAction,
    isChanged: !isEqual(
      {
        validator: state.validator,
        validationAction: action.validationAction,
        validationLevel: state.validationLevel,
      },
      state.prevValidation
    ),
  };
};

/**
 * Change validation level.
 */
const changeValidationLevel = (
  state: ValidationState,
  action: ValidationLevelChangedAction
): ValidationState => {
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
const MAPPINGS: {
  [Type in ValidationAction['type']]: (
    state: ValidationState,
    action: ValidationAction & { type: Type }
  ) => ValidationState;
} = {
  [VALIDATOR_CHANGED]: changeValidator,
  [VALIDATION_CANCELED]: setValidationCanceled,
  [VALIDATION_FETCHED]: setValidationFetched,
  [VALIDATION_SAVE_FAILED]: setValidationSaveErrored,
  [VALIDATION_ACTION_CHANGED]: changeValidationAction,
  [VALIDATION_LEVEL_CHANGED]: changeValidationLevel,
  [SET_VALIDATION_TO_DEFAULT]: setValidationToDefault,
  [VALIDATION_FETCH_ERRORED]: setValidationFetchErrored,
};

/**
 * Reducer function for handle state changes to status.
 */
export default function reducer(
  state: ValidationState = INITIAL_STATE,
  action: RootAction
): ValidationState {
  const fn = MAPPINGS[action.type as ValidationAction['type']];

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore-error TS does not understand that action can be passed to fn
  return fn ? fn(state, action) : state;
}

/**
 * Action creator for validation action changed events.
 */
export const validationActionChanged = (
  validationAction: ValidationServerAction
): ValidationActionChangedAction => ({
  type: VALIDATION_ACTION_CHANGED,
  validationAction,
});

/**
 * Action creator for validation level changed events.
 */
export const validationLevelChanged = (
  validationLevel: ValidationLevel
): ValidationLevelChangedAction => ({
  type: VALIDATION_LEVEL_CHANGED,
  validationLevel,
});

/**
 * Action creator for validator changed events.
 */
export const validatorChanged = (
  validator: string
): ValidatorChangedAction => ({
  type: VALIDATOR_CHANGED,
  validator,
});

/**
 * Action creator for validation fetched events.
 */
export const validationFetched = (validationUpdate: {
  validationAction: Validation['validationAction'];
  validationLevel: Validation['validationLevel'];
  validator: Validation['validator'];
}): ValidationFetchedAction => ({
  type: VALIDATION_FETCHED,
  ...validationUpdate,
});

export const validationFetchErrored = (
  error: Error
): ValidationFetchErroredAction => ({
  type: VALIDATION_FETCH_ERRORED,
  error,
});

/**
 * Action creator for validation canceled events.
 */
export const validationCanceled = (
  validation: Validation
): ValidationCanceledAction => ({
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
export const validationSaveFailed = (error: {
  message: string;
}): ValidationSaveFailedAction => ({
  type: VALIDATION_SAVE_FAILED,
  error,
});

export const fetchValidation = (namespace: {
  database: string;
  collection: string;
}): SchemaValidationThunkAction<Promise<void>> => {
  return async (dispatch, _getState, { dataService }) => {
    try {
      const collInfo = await dataService.collectionInfo(
        namespace.database,
        namespace.collection
      );

      if (!collInfo?.validation?.validator) {
        dispatch({
          type: SET_VALIDATION_TO_DEFAULT,
        });
        dispatch(isLoadedChanged(true));
        return;
      }

      // TODO(COMPASS-4989): EJSON??
      // const newValidation = {
      //   ...validation,
      //   validator: EJSON.stringify(validation.validator, undefined, 2),
      // };

      dispatch(
        validationFetched({
          validationAction:
            (collInfo.validation
              .validationAction as Validation['validationAction']) ??
            INITIAL_STATE.validationAction,
          validationLevel:
            (collInfo.validation
              .validationLevel as Validation['validationLevel']) ??
            INITIAL_STATE.validationLevel,
          validator: JSON.stringify(collInfo.validation.validator),
        })
      );
      dispatch(zeroStateChanged(false));
      dispatch(isLoadedChanged(true));
    } catch (err) {
      dispatch(validationFetchErrored(err as Error));
      dispatch(zeroStateChanged(false));
      dispatch(isLoadedChanged(true));
    }
  };
};

/**
 * Save validation.
 */
export const saveValidation = (
  validation: Validation
): SchemaValidationThunkAction<Promise<void>> => {
  return async (
    dispatch,
    getState,
    { dataService, track, connectionInfoRef }
  ) => {
    const state = getState();
    const namespace = state.namespace;
    const checkedValidator = checkValidator(validation.validator);
    const savedValidation = {
      validator: checkedValidator.validator,
      validationAction: validation.validationAction,
      validationLevel: validation.validationLevel,
      isChanged: false,
    };

    const trackEvent = {
      validation_action: validation.validationAction,
      validation_level: validation.validationLevel,
    };
    track('Schema Validation Updated', trackEvent, connectionInfoRef.current);
    try {
      await dataService.updateCollection(
        `${namespace.database}.${namespace.collection}`,
        {
          validator: savedValidation.validator,
          validationAction: savedValidation.validationAction,
          validationLevel: savedValidation.validationLevel,
        }
      );
      void dispatch(fetchValidation(namespace));
      dispatch(disableEditRules());
    } catch (error) {
      dispatch(validationSaveFailed(error as Error));
    }
  };
};

/**
 * Cancel validation.
 *
 * @returns {Function} The function.
 */
export const cancelValidation = () => {
  return (
    dispatch: ThunkDispatch<RootState, unknown, RootAction>,
    getState: () => RootState
  ) => {
    const state = getState();
    const prevValidation = state.validation.prevValidation;

    dispatch(disableEditRules());
    dispatch(
      validationCanceled({
        isChanged: false,
        validator: prevValidation!.validator,
        validationAction: prevValidation!.validationAction,
        validationLevel: prevValidation!.validationLevel,
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
export const activateValidation = (): SchemaValidationThunkAction<void> => {
  return (dispatch, getState) => {
    const state = getState();
    const namespace = state.namespace;

    void dispatch(fetchValidation(namespace));
  };
};
