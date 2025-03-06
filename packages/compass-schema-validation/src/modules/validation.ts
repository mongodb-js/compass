import type { RootAction, RootState, SchemaValidationThunkAction } from '.';
import { EJSON } from 'bson';
import { parseFilter } from 'mongodb-query-parser';
import { stringify as javascriptStringify } from 'javascript-stringify';
import { clearSampleDocuments } from './sample-documents';
import { zeroStateChanged } from './zero-state';
import { isLoadedChanged } from './is-loaded';
import { isEqual, pick } from 'lodash';
import type { ThunkDispatch } from 'redux-thunk';
import { disableEditRules, enableEditRules } from './edit-mode';
import { analyzeSchema } from '@mongodb-js/compass-schema-analysis';

export type ValidationServerAction = 'error' | 'warn';
export type ValidationLevel = 'off' | 'moderate' | 'strict';

const SAMPLE_SIZE = 1000;

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

/**
 * Syntax error occurred action name.
 */
export const SYNTAX_ERROR_OCCURRED = `${PREFIX}/SYNTAX_ERROR_OCCURRED` as const;
interface SyntaxErrorOccurredAction {
  type: typeof SYNTAX_ERROR_OCCURRED;
  syntaxError: null | { message: string };
}

export const RULES_GENERATION_STARTED =
  `${PREFIX}/RULES_GENERATION_STARTED` as const;
interface RulesGenerationStartedAction {
  type: typeof RULES_GENERATION_STARTED;
}

export const RULES_GENERATION_FAILED =
  `${PREFIX}/RULES_GENERATION_FAILED` as const;
interface RulesGenerationFailedAction {
  type: typeof RULES_GENERATION_FAILED;
  message: string;
}

export const RULES_GENERATION_CLEAR_ERROR =
  `${PREFIX}/RULES_GENERATION_CLEAR_ERROR` as const;
interface RulesGenerationClearErrorAction {
  type: typeof RULES_GENERATION_CLEAR_ERROR;
}

export const RULES_GENERATION_FINISHED =
  `${PREFIX}/RULES_GENERATION_FINISHED` as const;
interface RulesGenerationFinishedAction {
  type: typeof RULES_GENERATION_FINISHED;
}

export type ValidationAction =
  | ValidatorChangedAction
  | ValidationCanceledAction
  | ValidationSaveFailedAction
  | ValidationFetchedAction
  | ValidationActionChangedAction
  | ValidationLevelChangedAction
  | SyntaxErrorOccurredAction
  | RulesGenerationStartedAction
  | RulesGenerationFinishedAction
  | RulesGenerationFailedAction
  | RulesGenerationClearErrorAction;

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
  isRulesGenerationInProgress?: boolean;
  rulesGenerationError?: string;
}

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
 * Sets syntax error.
 */
const setSyntaxError = (
  state: ValidationState,
  action: SyntaxErrorOccurredAction
): ValidationState => ({
  ...state,
  isChanged: true,
  syntaxError: action.syntaxError,
});

const startRulesGeneration = (state: ValidationState): ValidationState => ({
  ...state,
  isRulesGenerationInProgress: true,
  rulesGenerationError: undefined,
});

const finishRulesGeneration = (state: ValidationState): ValidationState => ({
  ...state,
  isRulesGenerationInProgress: undefined,
  rulesGenerationError: undefined,
});

const markRulesGenerationFailure = (
  state: ValidationState,
  action: RulesGenerationFailedAction
): ValidationState => ({
  ...state,
  isRulesGenerationInProgress: undefined,
  rulesGenerationError: action.message,
});

const unsetRulesGenerationError = (
  state: ValidationState
): ValidationState => ({
  ...state,
  rulesGenerationError: undefined,
});

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
  [VALIDATION_SAVE_FAILED]: setError,
  [VALIDATION_ACTION_CHANGED]: changeValidationAction,
  [VALIDATION_LEVEL_CHANGED]: changeValidationLevel,
  [SYNTAX_ERROR_OCCURRED]: setSyntaxError,
  [RULES_GENERATION_STARTED]: startRulesGeneration,
  [RULES_GENERATION_FINISHED]: finishRulesGeneration,
  [RULES_GENERATION_FAILED]: markRulesGenerationFailure,
  [RULES_GENERATION_CLEAR_ERROR]: unsetRulesGenerationError,
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

/**
 * Action creator for syntax error occurred events.
 */
export const syntaxErrorOccurred = (
  syntaxError: null | { message: string }
): SyntaxErrorOccurredAction => ({
  type: SYNTAX_ERROR_OCCURRED,
  syntaxError,
});

export const clearRulesGenerationError =
  (): RulesGenerationClearErrorAction => ({
    type: RULES_GENERATION_CLEAR_ERROR,
  });

export const fetchValidation = (namespace: {
  database: string;
  collection: string;
}): SchemaValidationThunkAction<void> => {
  return (dispatch, _getState, { dataService }) => {
    dataService.collectionInfo(namespace.database, namespace.collection).then(
      (collInfo) => {
        const validation = validationFromCollection(null, collInfo ?? {});

        if (!validation.validator) {
          const newValidation = { ...validation, validator: '{}' };
          dispatch(validationFetched(newValidation));
          dispatch(isLoadedChanged(true));
          return;
        }

        // TODO(COMPASS-4989): EJSON??
        const newValidation = {
          ...validation,
          validator: EJSON.stringify(validation.validator, undefined, 2),
        };

        dispatch(validationFetched(newValidation));
        dispatch(zeroStateChanged(false));
        dispatch(isLoadedChanged(true));
      },
      (err: Error) => {
        dispatch(
          validationFetched({
            ...validationFromCollection(err),
            validator: undefined,
          })
        );
        dispatch(zeroStateChanged(false));
        dispatch(isLoadedChanged(true));
      }
    );
  };
};

export function validationFromCollection(
  err: null | { message: string },
  {
    validation,
  }: {
    validation?: {
      validationAction?: string;
      validationLevel?: string;
      validator?: null | Record<string, unknown>;
    } | null;
  } = {}
): Pick<Validation, 'validationAction' | 'validationLevel'> & {
  error?: { message: string };
  validator?: Record<string, unknown>;
} {
  const { validationAction, validationLevel } = INITIAL_STATE;
  if (err) {
    return { validationAction, validationLevel, error: err };
  }
  return {
    validationAction: (validation?.validationAction ??
      validationAction) as ValidationServerAction,
    validationLevel: (validation?.validationLevel ??
      validationLevel) as ValidationLevel,
    ...(validation?.validator && {
      validator: validation.validator,
    }),
  };
}

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
      dispatch(fetchValidation(namespace));
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

    dispatch(fetchValidation(namespace));
  };
};

export const stopRulesGeneration = (): SchemaValidationThunkAction<void> => {
  return (
    dispatch,
    getState,
    { rulesGenerationAbortControllerRef, connectionInfoRef, track }
  ) => {
    if (!rulesGenerationAbortControllerRef.current) return;
    // const analysisTime =
    //   Date.now() - (getState().schemaAnalysis.analysisStartTime ?? 0);
    // track(
    //   'Schema Analysis Cancelled',
    //   {
    //     analysis_time_ms: analysisTime,
    //     with_filter: Object.entries(query.filter ?? {}).length > 0,
    //   },
    //   connectionInfoRef.current
    // );

    rulesGenerationAbortControllerRef.current?.abort('Analysis cancelled');
  };
};

/**
 * Get $jsonSchema from schema analysis
 * @returns
 */
export const generateValidationRules = (): SchemaValidationThunkAction<
  Promise<void>
> => {
  return async (
    dispatch,
    getState,
    { dataService, logger, preferences, rulesGenerationAbortControllerRef }
  ) => {
    dispatch({ type: RULES_GENERATION_STARTED });
    console.log('START');

    rulesGenerationAbortControllerRef.current = new AbortController();
    const abortSignal = rulesGenerationAbortControllerRef.current.signal;

    const { namespace } = getState();
    const { maxTimeMS } = preferences.getPreferences();

    try {
      const samplingOptions = {
        query: {},
        size: SAMPLE_SIZE,
        fields: undefined,
      };
      const driverOptions = {
        maxTimeMS,
      };
      const schemaAccessor = await analyzeSchema(
        dataService,
        abortSignal,
        namespace.toString(),
        samplingOptions,
        driverOptions,
        logger,
        preferences
      );
      if (abortSignal?.aborted) {
        throw new Error(abortSignal?.reason || new Error('Operation aborted'));
      }

      const jsonSchema = await schemaAccessor?.getMongoDBJsonSchema({
        signal: abortSignal,
      });
      if (abortSignal?.aborted) {
        throw new Error(abortSignal?.reason || new Error('Operation aborted'));
      }
      const validator = JSON.stringify(
        { $jsonSchema: jsonSchema },
        undefined,
        2
      );
      dispatch(validationLevelChanged('moderate'));
      dispatch(validatorChanged(validator));
      dispatch(enableEditRules());
      dispatch({ type: RULES_GENERATION_FINISHED });
      dispatch(zeroStateChanged(false));
    } catch (error) {
      dispatch({
        type: RULES_GENERATION_FAILED,
        message: `Rules generation failed: ${(error as Error).message}`,
      });
    }
  };
};
