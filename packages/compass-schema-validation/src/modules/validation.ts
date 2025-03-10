import type { RootAction, RootState, SchemaValidationThunkAction } from '.';
import { EJSON } from 'bson';
import { parseFilter } from 'mongodb-query-parser';
import { stringify as javascriptStringify } from 'javascript-stringify';
import { openToast } from '@mongodb-js/compass-components';
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
  error: null | { message: string };
}

/**
 * Validation fetched action name.
 */
export const VALIDATION_FETCHED = `${PREFIX}/VALIDATION_FETCHED` as const;
interface ValidationFetchedAction {
  type: typeof VALIDATION_FETCHED;
  validation: PartialValidation;
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
 * Validation level changed action name.
 */
export const VALIDATION_LEVEL_CHANGED =
  `${PREFIX}/VALIDATION_LEVEL_CHANGED` as const;
interface ValidationLevelChangedAction {
  type: typeof VALIDATION_LEVEL_CHANGED;
  validationLevel: ValidationLevel;
}

export const SET_VALIDATION_TO_DEFAULT =
  `${PREFIX}/SET_VALIDATION_TO_DEFAULT` as const;
export interface SetValidationToDefaultAction {
  type: typeof SET_VALIDATION_TO_DEFAULT;
  validator: string;
}

export type ValidationAction =
  | ValidatorChangedAction
  | ValidationCanceledAction
  | ValidationSaveFailedAction
  | ValidationFetchedAction
  | SetValidationToDefaultAction
  | ValidationActionChangedAction
  | ValidationLevelChangedAction;

export interface Validation {
  validator: string;
  validationAction: ValidationServerAction;
  validationLevel: ValidationLevel;
  isChanged?: boolean;
  error?: null | { message: string };
}
type PartialValidation = Pick<
  Validation,
  'validationAction' | 'validationLevel'
> &
  Partial<Validation>;

export interface ValidationState extends Validation {
  isChanged: boolean;
  syntaxError: null | { message: string };
  error: null | { message: string };
  prevValidation?: Validation;
}

export const VALIDATION_TEMPLATE = `/**
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
}`;

/**
 * The initial state.
 */
export const INITIAL_STATE: ValidationState = {
  validator: '',
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
  syntaxError: null | { message: string };
  validator: Record<string, unknown> | string;
} => {
  const validation: {
    syntaxError: null | { message: string };
    validator: Record<string, unknown> | string;
  } = { syntaxError: null, validator };

  if (validator === '') {
    validation.syntaxError = {
      message: 'The validator must be an object.',
    };
  } else {
    try {
      validation.validator = parseFilter(validator);
    } catch (error) {
      validation.syntaxError = error as Error;
    }
  }

  return validation;
};

/**
 * Change validator.
 */
const changeValidator = (
  state: ValidationState,
  action: ValidatorChangedAction
): ValidationState => {
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
 * Set validation.
 */
const setValidation = (
  state: ValidationState,
  action: ValidationFetchedAction | ValidationCanceledAction
): ValidationState => {
  const checkedValidator = checkValidator(action.validation.validator ?? '');
  // TODO(COMPASS-4989): javascriptStringify??
  const validator = javascriptStringify(
    checkedValidator.validator,
    null,
    2
  ) as string;

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
 */
const setError = (
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

const changeValidationToDefault = (
  state: ValidationState,
  action: SetValidationToDefaultAction
): ValidationState => {
  return {
    ...state,
    validationAction: INITIAL_STATE.validationAction,
    validationLevel: INITIAL_STATE.validationLevel,
    validator: action.validator,

    // Set the previous validation to undefined so that the isChanged
    // flag is set to true in future checks.
    prevValidation: undefined,
    isChanged: true,
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
  [VALIDATION_CANCELED]: setValidation,
  [VALIDATION_FETCHED]: setValidation,
  [SET_VALIDATION_TO_DEFAULT]: changeValidationToDefault,
  [VALIDATION_SAVE_FAILED]: setError,
  [VALIDATION_ACTION_CHANGED]: changeValidationAction,
  [VALIDATION_LEVEL_CHANGED]: changeValidationLevel,
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
export const validationFetched = (
  validation: PartialValidation
): ValidationFetchedAction => ({
  type: VALIDATION_FETCHED,
  validation,
});

export const setValidationToDefault = (validator: string) => ({
  type: SET_VALIDATION_TO_DEFAULT,
  validator,
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
  return async (dispatch, _getState, { dataService, preferences }) => {
    try {
      const collInfo = await dataService.collectionInfo(
        namespace.database,
        namespace.collection
      );
      if (!collInfo?.validation?.validator) {
        dispatch(
          setValidationToDefault(
            preferences.getPreferences().enableExportSchema
              ? VALIDATION_TEMPLATE
              : '{}'
          )
        );
        dispatch(isLoadedChanged(true));
        return;
      }

      dispatch(
        validationFetched({
          validationAction:
            (collInfo.validation.validationAction as ValidationServerAction) ??
            INITIAL_STATE.validationAction,
          validationLevel:
            (collInfo.validation.validationLevel as ValidationLevel) ??
            INITIAL_STATE.validationLevel,
          // TODO(COMPASS-4989): EJSON??
          validator: EJSON.stringify(
            collInfo.validation.validator,
            undefined,
            2
          ),
        })
      );
      dispatch(zeroStateChanged(false));
      dispatch(isLoadedChanged(true));
    } catch (err) {
      dispatch(
        validationFetched({
          validationAction: INITIAL_STATE.validationAction,
          validationLevel: INITIAL_STATE.validationLevel,
          error: err as Error,
          validator: undefined,
        })
      );
      dispatch(zeroStateChanged(false));
      dispatch(isLoadedChanged(true));
    }
  };
};

const toastId = 'schema-validation-update';

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
      openToast(toastId, {
        title: 'New validation rules applied',
        variant: 'success',
      });
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
export const cancelValidation = (): SchemaValidationThunkAction<void> => {
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
        validator: prevValidation?.validator ?? '{}',
        validationAction:
          prevValidation?.validationAction ?? INITIAL_STATE.validationAction,
        validationLevel:
          prevValidation?.validationLevel ?? INITIAL_STATE.validationLevel,
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
