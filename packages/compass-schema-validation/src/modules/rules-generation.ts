import type { SchemaValidationThunkAction } from '.';
import { zeroStateChanged } from './zero-state';
import { enableEditRules } from './edit-mode';
import type { MongoError } from 'mongodb';
import type { Action, Reducer } from 'redux';
import {
  ValidationActions,
  validationLevelChanged,
  validatorChanged,
} from './validation';
import {
  type analyzeSchema as analyzeSchemaType,
  calculateSchemaMetadata,
} from '@mongodb-js/compass-schema';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import type { ConnectionInfoRef } from '@mongodb-js/compass-connections/provider';
import { isAction } from '../util';

const ERROR_CODE_MAX_TIME_MS_EXPIRED = 50;

const SAMPLE_SIZE = 1000;
const ABORT_MESSAGE = 'Operation cancelled';

export const enum RulesGenerationActions {
  generationStarted = 'schema-validation/rules-generation/generationStarted',
  generationFailed = 'schema-validation/rules-generation/generationFailed',
  generationFinished = 'schema-validation/rules-generation/generationFinished',
  generationErrorCleared = 'schema-validation/rules-generation/generationErrorCleared',
}

export type RulesGenerationStarted = {
  type: RulesGenerationActions.generationStarted;
};

export type RulesGenerationFailed = {
  type: RulesGenerationActions.generationFailed;
  error: Error;
};

export type RulesGenerationErrorCleared = {
  type: RulesGenerationActions.generationErrorCleared;
};

export type RulesGenerationFinished = {
  type: RulesGenerationActions.generationFinished;
};

export type RulesGenerationError = {
  errorMessage: string;
  errorType: 'timeout' | 'highComplexity' | 'general';
};

export interface RulesGenerationState {
  isInProgress: boolean;
  isGenerated: boolean;
  error?: RulesGenerationError;
}

/**
 * The initial state.
 */
export const INITIAL_STATE: RulesGenerationState = {
  isInProgress: false,
  isGenerated: false,
};

function getErrorDetails(error: Error): RulesGenerationError {
  const errorCode = (error as MongoError).code;
  const errorMessage = error.message || 'Unknown error';
  let errorType: RulesGenerationError['errorType'] = 'general';
  if (errorCode === ERROR_CODE_MAX_TIME_MS_EXPIRED) {
    errorType = 'timeout';
  } else if (error.message.includes('Schema analysis aborted: Fields count')) {
    errorType = 'highComplexity';
  }

  return {
    errorType,
    errorMessage,
  };
}

/**
 * Reducer function for handle state changes to status.
 */
export const rulesGenerationReducer: Reducer<RulesGenerationState, Action> = (
  state = INITIAL_STATE,
  action
) => {
  if (
    isAction<RulesGenerationStarted>(
      action,
      RulesGenerationActions.generationStarted
    )
  ) {
    return {
      ...state,
      isInProgress: true,
      error: undefined,
    };
  }

  if (
    isAction<RulesGenerationFinished>(
      action,
      RulesGenerationActions.generationFinished
    )
  ) {
    return {
      ...state,
      isInProgress: false,
      isGenerated: true,
    };
  }

  if (
    isAction<RulesGenerationFailed>(
      action,
      RulesGenerationActions.generationFailed
    )
  ) {
    return {
      ...state,
      isInProgress: false,
      error: getErrorDetails(action.error),
    };
  }

  if (
    isAction(action, ValidationActions.ValidatorChanged) &&
    state.isGenerated
  ) {
    return {
      ...state,
      isGenerated: false, // the generated validator has been changed
    };
  }

  if (
    isAction<RulesGenerationErrorCleared>(
      action,
      RulesGenerationActions.generationErrorCleared
    )
  ) {
    return {
      ...state,
      error: undefined,
    };
  }

  return state;
};

export const clearRulesGenerationError =
  (): SchemaValidationThunkAction<RulesGenerationErrorCleared> => {
    return (dispatch) =>
      dispatch({ type: RulesGenerationActions.generationErrorCleared });
  };

export const stopRulesGeneration = (): SchemaValidationThunkAction<void> => {
  return (dispatch, getState, { rulesGenerationAbortControllerRef }) => {
    if (!rulesGenerationAbortControllerRef.current) return;
    rulesGenerationAbortControllerRef.current?.abort(ABORT_MESSAGE);
  };
};

const _trackRulesGenerated = async ({
  schemaAccessor,
  track,
  connectionInfoRef,
}: {
  schemaAccessor: Awaited<ReturnType<typeof analyzeSchemaType>>;
  track: TrackFunction;
  connectionInfoRef: ConnectionInfoRef;
}) => {
  const internalSchema = await schemaAccessor?.getInternalSchema();
  if (!internalSchema) return;
  const { variable_type_count, optional_field_count } =
    await calculateSchemaMetadata(internalSchema);
  track(
    'Schema Validation Generated',
    {
      variable_type_count,
      optional_field_count,
    },
    connectionInfoRef.current
  );
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
    {
      dataService,
      logger,
      preferences,
      rulesGenerationAbortControllerRef,
      analyzeSchema,
      track,
      connectionInfoRef,
    }
  ) => {
    dispatch({ type: RulesGenerationActions.generationStarted });

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
        throw new Error(ABORT_MESSAGE);
      }

      const jsonSchema = await schemaAccessor?.getMongoDBJsonSchema({
        signal: abortSignal,
      });
      if (abortSignal?.aborted) {
        throw new Error(ABORT_MESSAGE);
      }
      const validator = JSON.stringify(
        { $jsonSchema: jsonSchema },
        undefined,
        2
      );
      dispatch(validationLevelChanged('moderate'));
      dispatch(validatorChanged(validator));
      dispatch(enableEditRules());
      dispatch({ type: RulesGenerationActions.generationFinished });
      dispatch(zeroStateChanged(false));

      void _trackRulesGenerated({
        schemaAccessor,
        connectionInfoRef,
        track,
      });
    } catch (error) {
      if (abortSignal.aborted) {
        dispatch({ type: RulesGenerationActions.generationFinished });
        return;
      }
      dispatch({
        type: RulesGenerationActions.generationFailed,
        error,
      });
    }
  };
};
