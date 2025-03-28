import type { RootAction, SchemaValidationThunkAction } from '.';
import { type Document, EJSON } from 'bson';
import { parseFilter } from 'mongodb-query-parser';
import { stringify as javascriptStringify } from 'javascript-stringify';
import { openToast } from '@mongodb-js/compass-components';
import { VALIDATION_TEMPLATE } from '@mongodb-js/mongodb-constants';
import { isEqual, pick } from 'lodash';
import { disableEditRules } from './edit-mode';
import { isAction } from '../util';
import {
  IS_ZERO_STATE_CHANGED,
  type IsZeroStateChangedAction,
} from './zero-state';
import semver from 'semver';

export type ValidationServerAction = 'error' | 'warn' | 'errorAndLog';
export type ValidationLevel = 'off' | 'moderate' | 'strict';

export const enum ValidationActions {
  ValidatorChanged = 'compass-schema-validation/validation/ValidatorChanged',
  ValidationCanceled = 'compass-schema-validation/validation/ValidationCanceled',
  ValidationSaveStarted = 'compass-schema-validation/validation/ValidationSaveStarted',
  ValidationSaveEnded = 'compass-schema-validation/validation/ValidationSaveEnded',
  ValidationSaveFailed = 'compass-schema-validation/validation/ValidationSaveFailed',
  ValidationFetched = 'compass-schema-validation/validation/ValidationFetched',
  EmptyValidationFetched = 'compass-schema-validation/validation/EmptyValidationFetched',
  ValidationActionChanged = 'compass-schema-validation/validation/ValidationActionChanged',
  ValidationLevelChanged = 'compass-schema-validation/validation/ValidationLevelChanged',
  ValidationFetchErrored = 'compass-schema-validation/validation/ValidationFetchErrored',
}

interface ValidatorChangedAction {
  type: ValidationActions.ValidatorChanged;
  validator: string;
}

export interface ValidationCanceledAction {
  type: ValidationActions.ValidationCanceled;
}

interface ValidationSaveStartedAction {
  type: ValidationActions.ValidationSaveStarted;
}

interface ValidationSaveEndedAction {
  type: ValidationActions.ValidationSaveEnded;
}

interface ValidationSaveFailedAction {
  type: ValidationActions.ValidationSaveFailed;
  error: { message: string };
}
export interface ValidationFetchedAction {
  type: ValidationActions.ValidationFetched;
  validator: Document;
  validationAction: ValidationServerAction;
  validationLevel: ValidationLevel;
}

export interface ValidationFetchErroredAction {
  type: ValidationActions.ValidationFetchErrored;
  error: { message: string };
}

export interface EmptyValidationFetchedAction {
  type: ValidationActions.EmptyValidationFetched;
  validationTemplate: string;
}

interface ValidationActionChangedAction {
  type: ValidationActions.ValidationActionChanged;
  validationAction: ValidationServerAction;
}

interface ValidationLevelChangedAction {
  type: ValidationActions.ValidationLevelChanged;
  validationLevel: ValidationLevel;
}

export type ValidationAction =
  | ValidatorChangedAction
  | ValidationCanceledAction
  | ValidationSaveFailedAction
  | ValidationFetchedAction
  | ValidationFetchErroredAction
  | EmptyValidationFetchedAction
  | ValidationActionChangedAction
  | ValidationLevelChangedAction;

export interface Validation {
  validator: string;
  validationAction: ValidationServerAction;
  validationLevel: ValidationLevel;
  isChanged?: boolean;
  error?: null | { message: string };
}

export interface ValidationState extends Validation {
  isChanged: boolean;
  isSaving: boolean;
  syntaxError: null | { message: string };
  error: null | { message: string };
  prevValidation?: Validation;
}

/**
 * The initial state.
 */
export const INITIAL_STATE: ValidationState = {
  validator: '',
  validationAction: 'error',
  validationLevel: 'strict',
  isChanged: false,
  isSaving: false,
  syntaxError: null,
  error: null,
};

const DEFAULT_VALIDATION: Pick<
  Validation,
  'validator' | 'validationAction' | 'validationLevel'
> = {
  validator: '{}',
  validationAction: 'error',
  validationLevel: 'strict',
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

export default function reducer(
  state: ValidationState = INITIAL_STATE,
  action: RootAction
): ValidationState {
  if (
    isAction<ValidatorChangedAction>(action, ValidationActions.ValidatorChanged)
  ) {
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
  }

  if (
    isAction<ValidationSaveStartedAction>(
      action,
      ValidationActions.ValidationSaveStarted
    )
  ) {
    return {
      ...state,
      error: null,
      isSaving: true,
    };
  }

  if (
    isAction<ValidationSaveEndedAction>(
      action,
      ValidationActions.ValidationSaveEnded
    )
  ) {
    return {
      ...state,
      isSaving: false,
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
    isAction<EmptyValidationFetchedAction>(
      action,
      ValidationActions.EmptyValidationFetched
    )
  ) {
    return {
      ...state,
      prevValidation: {
        ...DEFAULT_VALIDATION,
      },
      ...DEFAULT_VALIDATION,
      isChanged: false,
      error: null,
      syntaxError: null,
      validator: action.validationTemplate,
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
      prevValidation: {
        ...DEFAULT_VALIDATION,
      },
      isChanged: true,
      error: action.error,
      syntaxError: null,
      ...DEFAULT_VALIDATION,
    };
  }

  if (
    isAction<ValidationFetchedAction>(
      action,
      ValidationActions.ValidationFetched
    )
  ) {
    // TODO(COMPASS-4989): EJSON??
    const checkedValidator = checkValidator(
      EJSON.stringify(action.validator, undefined, 2)
    );
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
        validationAction: action.validationAction,
        validationLevel: action.validationLevel,
      },
      isChanged: false,
      validator,
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
  }

  if (isAction<IsZeroStateChangedAction>(action, IS_ZERO_STATE_CHANGED)) {
    return {
      ...state,
      isChanged: true,
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
      validationLevel: action.validationLevel,
      isChanged: !isEqual(
        {
          validator: state.validator,
          validationAction: state.validationAction,
          validationLevel: action.validationLevel,
        },
        state.prevValidation
      ),
    };
  }

  if (
    isAction<ValidationCanceledAction>(
      action,
      ValidationActions.ValidationCanceled
    )
  ) {
    const prevValidation = state.prevValidation;

    return {
      ...state,
      isChanged: false,
      validator: prevValidation?.validator ?? '{}',
      validationAction:
        prevValidation?.validationAction ?? INITIAL_STATE.validationAction,
      validationLevel:
        prevValidation?.validationLevel ?? INITIAL_STATE.validationLevel,
      error: null,
    };
  }

  return state;
}

export const validationFetchErrored = (error: {
  message: string;
}): ValidationFetchErroredAction => ({
  type: ValidationActions.ValidationFetchErrored,
  error,
});

export const validationActionChanged = (
  validationAction: ValidationServerAction
): ValidationActionChangedAction => ({
  type: ValidationActions.ValidationActionChanged,
  validationAction,
});

export const validationLevelChanged = (
  validationLevel: ValidationLevel
): ValidationLevelChangedAction => ({
  type: ValidationActions.ValidationLevelChanged,
  validationLevel,
});

export const validatorChanged = (
  validator: string
): ValidatorChangedAction => ({
  type: ValidationActions.ValidatorChanged,
  validator,
});

export const validationFetched = ({
  validator,
  validationLevel,
  validationAction,
}: {
  validator: Document;
  validationLevel: ValidationLevel;
  validationAction: ValidationServerAction;
}): ValidationFetchedAction => ({
  type: ValidationActions.ValidationFetched,
  validator,
  validationLevel,
  validationAction,
});

export const emptyValidationFetched = ({
  validationTemplate,
}: {
  validationTemplate: string;
}): EmptyValidationFetchedAction => ({
  type: ValidationActions.EmptyValidationFetched,
  validationTemplate,
});

export const validationSaveStarted = (): ValidationSaveStartedAction => ({
  type: ValidationActions.ValidationSaveStarted,
});

export const validationSaveEnded = (): ValidationSaveEndedAction => ({
  type: ValidationActions.ValidationSaveEnded,
});

export const validationCanceled = (): ValidationCanceledAction => ({
  type: ValidationActions.ValidationCanceled,
});

export const validationSaveFailed = (error: {
  message: string;
}): ValidationSaveFailedAction => ({
  type: ValidationActions.ValidationSaveFailed,
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
          emptyValidationFetched({
            validationTemplate: preferences.getPreferences().enableExportSchema
              ? VALIDATION_TEMPLATE
              : '{}',
          })
        );
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
          validator: collInfo.validation.validator,
        })
      );
    } catch (err) {
      dispatch(validationFetchErrored(err as Error));
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

    dispatch(validationSaveStarted());

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
    } finally {
      dispatch(validationSaveEnded());
    }
  };
};

export const cancelValidation = (): ValidationCanceledAction => ({
  type: ValidationActions.ValidationCanceled,
});

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

export const hasErrorAndLogValidationActionSupport = (
  serverVersion: string
) => {
  try {
    return semver.gte(serverVersion, '8.1.0-rc.0');
  } catch (err) {
    return false;
  }
};
