import type { AnyAction } from 'redux';
import type { RootAction, RootState, SchemaValidationThunkAction } from '.';
import { EJSON } from 'bson';
import { parseFilter } from 'mongodb-query-parser';
import { stringify as javascriptStringify } from 'javascript-stringify';
import { clearSampleDocuments } from './sample-documents';
import { zeroStateChanged } from './zero-state';
import { isLoadedChanged } from './is-loaded';
import { isEqual } from 'lodash';
import type { ThunkDispatch } from 'redux-thunk';
import { disableEditRules } from './edit-mode';

export type ValidationServerAction = 'error' | 'warn';
export type ValidationLevel = 'off' | 'moderate' | 'strict';

function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

export const enum ValidationActions {
  ChangeValidator = 'compass-schema-validation/validation/ChangeValidator',
  CancelChangeValidator = 'compass-schema-validation/validation/CancelChangeValidator',
  ValidationSaveFailed = 'compass-schema-validation/validation/ValidationSaveFailed',
  ValidationFetched = 'compass-schema-validation/validation/ValidationFetched',
  ValidationActionChanged = 'compass-schema-validation/validation/ValidationActionChanged',
  ValidationLevelChanged = 'compass-schema-validation/validation/ValidationLevelChanged',
  ValidationFetchErrored = 'compass-schema-validation/validation/ValidationFetchErrored',
}

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

interface ChangeValidatorAction {
  type: ValidationActions.ChangeValidator;
  validator: string;
  syntaxError: null | Error;
  isChanged: boolean;
}

interface ValidationCanceledAction {
  type: ValidationActions.CancelChangeValidator;
  validation: Validation;
}

interface ValidationSaveFailedAction {
  type: ValidationActions.ValidationSaveFailed;
  error: Error;
}

interface ValidationFetchedAction {
  type: ValidationActions.ValidationFetched;
  validationAction: Validation['validationAction'];
  validationLevel: Validation['validationLevel'];
  validator: Validation['validator'];
}

interface ValidationActionChangedAction {
  type: ValidationActions.ValidationActionChanged;
  validationAction: ValidationServerAction;
  isChanged: boolean;
}

interface ValidationFetchErroredAction {
  type: ValidationActions.ValidationFetchErrored;
  error: Error;
}

interface ValidationLevelChangedAction {
  type: ValidationActions.ValidationLevelChanged;
  validationLevel: ValidationLevel;
  isChanged: boolean;
}

export type ValidationAction =
  | ChangeValidatorAction
  | ValidationCanceledAction
  | ValidationSaveFailedAction
  | ValidationFetchedAction
  | ValidationActionChangedAction
  | ValidationLevelChangedAction
  | ValidationFetchErroredAction;

export interface Validation {
  validator: string;
  validationAction: ValidationServerAction;
  validationLevel: ValidationLevel;
  isChanged: boolean;
  error: null | Error;
}

export interface ValidationState extends Validation {
  isChanged: boolean;
  syntaxError: null | Error;
  error: null | Error;
  prevValidation?: Pick<
    Validation,
    'validator' | 'validationAction' | 'validationLevel'
  >;
}

export const INITIAL_STATE: ValidationState = {
  validator: VALIDATION_TEMPLATE,
  validationAction: 'error',
  validationLevel: 'strict',
  isChanged: true,
  syntaxError: null,
  error: null,
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

export default function reducer(
  state: ValidationState = INITIAL_STATE,
  action: RootAction
): ValidationState {
  if (
    isAction<ChangeValidatorAction>(action, ValidationActions.ChangeValidator)
  ) {
    return {
      ...state,
      error: null,
      syntaxError: action.syntaxError,
      validator: action.validator,
      isChanged: action.isChanged,
    };
  }

  if (
    isAction<ValidationCanceledAction>(
      action,
      ValidationActions.CancelChangeValidator
    )
  ) {
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
  }

  if (
    isAction<ValidationSaveFailedAction>(
      action,
      ValidationActions.ValidationSaveFailed
    )
  ) {
    return {
      ...state,
      error: action.error,
    };
  }

  if (
    isAction<ValidationFetchedAction>(
      action,
      ValidationActions.ValidationFetched
    )
  ) {
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
  }

  if (
    isAction<ValidationActionChangedAction>(
      action,
      ValidationActions.ValidationActionChanged
    )
  ) {
    return {
      ...state,
      error: null,
      validationAction: action.validationAction,
      isChanged: action.isChanged,
    };
  }

  if (
    isAction<ValidationLevelChangedAction>(
      action,
      ValidationActions.ValidationLevelChanged
    )
  ) {
    return {
      ...state,
      error: null,
      validationLevel: action.validationLevel,
      isChanged: action.isChanged,
    };
  }

  if (
    isAction<ValidationFetchErroredAction>(
      action,
      ValidationActions.ValidationFetchErrored
    )
  ) {
    return {
      ...state,
      error: action.error,
    };
  }

  return state;
}

export const validationActionChanged = (
  validationAction: ValidationServerAction
): SchemaValidationThunkAction<void> => {
  return (dispatch, getState) => {
    const {
      validation: { prevValidation, validator, validationLevel },
    } = getState();

    return {
      type: ValidationActions.ValidationActionChanged,
      validationAction,
      isChanged: !isEqual(
        {
          validator,
          validationAction,
          validationLevel,
        },
        prevValidation
      ),
    };
  };
};

export const validationLevelChanged = (
  validationLevel: ValidationLevel
): SchemaValidationThunkAction<void> => {
  return (dispatch, getState) => {
    const {
      validation: { prevValidation, validator, validationAction },
    } = getState();

    return {
      type: ValidationActions.ValidationLevelChanged,
      validationLevel,
      isChanged: !isEqual(
        {
          validator,
          validationAction,
          validationLevel,
        },
        prevValidation
      ),
    };
  };
};

export const changeValidator = (
  validator: string
): SchemaValidationThunkAction<void> => {
  return (dispatch, getState) => {
    const syntaxError = checkValidatorForSyntaxError(validator);

    const {
      validation: { prevValidation, validationAction, validationLevel },
    } = getState();

    return {
      type: ValidationActions.ChangeValidator,
      validator,
      syntaxError,
      isChanged: !isEqual(
        {
          validator,
          validationAction,
          validationLevel,
        },
        prevValidation
      ),
    };
  };
};

export const validationFetched = (validationUpdate: {
  validationAction: Validation['validationAction'];
  validationLevel: Validation['validationLevel'];
  validator: Validation['validator'];
}): ValidationFetchedAction => ({
  type: ValidationActions.ValidationFetched,
  ...validationUpdate,
});

export const validationFetchErrored = (
  error: Error
): ValidationFetchErroredAction => ({
  type: ValidationActions.ValidationFetchErrored,
  error,
});

export const validationCanceled = (
  validation: Validation
): ValidationCanceledAction => ({
  type: ValidationActions.CancelChangeValidator,
  validation,
});

export const validationSaveFailed = (
  error: Error
): ValidationSaveFailedAction => ({
  type: ValidationActions.ValidationSaveFailed,
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
        dispatch(isLoadedChanged(true));
        return;
      }

      // TODO(COMPASS-4989): EJSON??
      const stringifiedValidator = EJSON.stringify(
        collInfo.validation.validator,
        undefined,
        2
      );
      const parsedValidator = parseFilter(stringifiedValidator);
      // The validation editor accepts js objects (as well as json), so we convert
      // the stringified validator to a js object.
      const jsonStringifiedValidator =
        javascriptStringify(parsedValidator) ?? '';

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
          validator: jsonStringifiedValidator,
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

    const trackEvent = {
      validation_action: validation.validationAction,
      validation_level: validation.validationLevel,
    };
    track('Schema Validation Updated', trackEvent, connectionInfoRef.current);
    try {
      await dataService.updateCollection(
        `${namespace.database}.${namespace.collection}`,
        {
          validator: parseFilter(validation.validator),
          validationAction: validation.validationAction,
          validationLevel: validation.validationLevel,
        }
      );
      void dispatch(fetchValidation(namespace));
      dispatch(disableEditRules());
    } catch (error) {
      dispatch(validationSaveFailed(error as Error));
    }
  };
};

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
