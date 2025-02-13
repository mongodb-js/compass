import type { Action, Reducer } from 'redux';
import { mongoLogId } from '@mongodb-js/compass-logging/provider';
import type {
  StandardJSONSchema,
  InternalSchema,
  MongoDBJSONSchema,
  ExpandedJSONSchema,
  SchemaAccessor,
} from 'mongodb-schema';

import type { SchemaThunkAction } from './store';
import { isAction } from '../utils';

export type SchemaFormat =
  | 'standardJSON'
  | 'mongoDBJSON'
  | 'extendedJSON'
  | 'legacyJSON';
export type ExportStatus = 'inprogress' | 'complete' | 'error';
export type SchemaExportState = {
  isOpen: boolean;
  exportedSchema?: string;
  exportFormat: SchemaFormat;
  errorMessage?: string;
  exportStatus: ExportStatus;
};

const defaultSchemaFormat: SchemaFormat = 'standardJSON';

const getInitialState = (): SchemaExportState => ({
  errorMessage: undefined,
  exportFormat: defaultSchemaFormat,
  exportStatus: 'inprogress',
  exportedSchema: undefined,
  isOpen: false,
});

export const enum SchemaExportActions {
  openExportSchema = 'schema-service/schema-export/openExportSchema',
  closeExportSchema = 'schema-service/schema-export/closeExportSchema',
  changeExportSchemaStatus = 'schema-service/schema-export/changeExportSchemaStatus',
  changeExportSchemaFormatStarted = 'schema-service/schema-export/changeExportSchemaFormatStarted',
  changeExportSchemaFormatComplete = 'schema-service/schema-export/changeExportSchemaFormatComplete',
  changeExportSchemaFormatError = 'schema-service/schema-export/changeExportSchemaFormatError',
  cancelExportSchema = 'schema-service/schema-export/cancelExportSchema',
}

export type OpenExportSchemaAction = {
  type: SchemaExportActions.openExportSchema;
};
export const openExportSchema = (): SchemaThunkAction<
  void,
  OpenExportSchemaAction
> => {
  return (dispatch) => {
    void dispatch(changeExportSchemaFormat(defaultSchemaFormat));

    dispatch({
      type: SchemaExportActions.openExportSchema,
    });
  };
};

export type CloseExportSchemaAction = {
  type: SchemaExportActions.closeExportSchema;
};
export const closeExportSchema = (): SchemaThunkAction<
  void,
  CloseExportSchemaAction
> => {
  return (dispatch, getState, { exportAbortControllerRef }) => {
    exportAbortControllerRef.current?.abort();

    return dispatch({
      type: SchemaExportActions.closeExportSchema,
    });
  };
};

export type CancelExportSchemaAction = {
  type: SchemaExportActions.cancelExportSchema;
};

export type ChangeExportSchemaFormatStartedAction = {
  type: SchemaExportActions.changeExportSchemaFormatStarted;
  exportFormat: SchemaFormat;
};

export type ChangeExportSchemaFormatErroredAction = {
  type: SchemaExportActions.changeExportSchemaFormatError;
  errorMessage: string;
};

export type ChangeExportSchemaFormatCompletedAction = {
  type: SchemaExportActions.changeExportSchemaFormatComplete;
  exportedSchema: string;
};

export const cancelExportSchema = (): SchemaThunkAction<
  void,
  CancelExportSchemaAction
> => {
  return (dispatch, getState, { exportAbortControllerRef }) => {
    exportAbortControllerRef.current?.abort();

    return dispatch({
      type: SchemaExportActions.cancelExportSchema,
    });
  };
};

async function getSchemaByFormat({
  exportFormat,
  schemaAccessor,
}: {
  exportFormat: SchemaFormat;
  schemaAccessor: SchemaAccessor;
  signal: AbortSignal;
}): Promise<string> {
  // TODO: Use the signal once we pull in the schema accessor type changes.
  let schema:
    | StandardJSONSchema
    | MongoDBJSONSchema
    | ExpandedJSONSchema
    | InternalSchema;
  switch (exportFormat) {
    case 'standardJSON':
      schema = await schemaAccessor.getStandardJsonSchema();
      break;
    case 'mongoDBJSON':
      schema = await schemaAccessor.getMongoDBJsonSchema();
      break;
    case 'extendedJSON':
      schema = await schemaAccessor.getExpandedJSONSchema();
      break;
    case 'legacyJSON':
      schema = await schemaAccessor.getInternalSchema();
      break;
  }

  return JSON.stringify(schema, null, 2);
}

export const changeExportSchemaFormat = (
  exportFormat: SchemaFormat
): SchemaThunkAction<
  Promise<void>,
  | ChangeExportSchemaFormatStartedAction
  | ChangeExportSchemaFormatErroredAction
  | ChangeExportSchemaFormatCompletedAction
> => {
  return async (
    dispatch,
    getState,
    { logger: { log }, exportAbortControllerRef, schemaAccessorRef }
  ) => {
    // If we're already in progress we abort their current operation.
    exportAbortControllerRef.current?.abort();

    exportAbortControllerRef.current = new AbortController();
    const abortSignal = exportAbortControllerRef.current.signal;

    dispatch({
      type: SchemaExportActions.changeExportSchemaFormatStarted,
      exportFormat,
    });

    let exportedSchema: string;
    try {
      log.info(
        mongoLogId(1_001_000_342),
        'Schema export formatting',
        'Formatting schema',
        {
          format: exportFormat,
        }
      );

      const schemaAccessor = schemaAccessorRef.current;
      if (!schemaAccessor) {
        throw new Error('No schema analysis available');
      }

      exportedSchema = await getSchemaByFormat({
        schemaAccessor,
        exportFormat,
        signal: abortSignal,
      });
    } catch (err: any) {
      if (abortSignal.aborted) {
        return;
      }
      log.error(
        mongoLogId(1_001_000_343),
        'Schema export formatting',
        'Error formatting schema',
        {
          error: err.stack,
        }
      );

      dispatch({
        type: SchemaExportActions.changeExportSchemaFormatError,
        errorMessage: (err as Error).message,
      });
      return;
    }

    if (abortSignal.aborted) {
      return;
    }

    log.info(
      mongoLogId(1_001_000_344),
      'Schema export formatting complete',
      'Formatting schema complete',
      {
        format: exportFormat,
        exportedSchemaLength: exportedSchema.length,
      }
    );

    dispatch({
      type: SchemaExportActions.changeExportSchemaFormatComplete,
      exportedSchema,
    });
  };
};

export const schemaExportReducer: Reducer<SchemaExportState, Action> = (
  state = getInitialState(),
  action
) => {
  if (
    isAction<OpenExportSchemaAction>(
      action,
      SchemaExportActions.openExportSchema
    )
  ) {
    return {
      ...state,
      isOpen: true,
    };
  }

  if (
    isAction<CloseExportSchemaAction>(
      action,
      SchemaExportActions.closeExportSchema
    )
  ) {
    return {
      ...state,
      isOpen: false,
    };
  }

  if (
    isAction<ChangeExportSchemaFormatStartedAction>(
      action,
      SchemaExportActions.changeExportSchemaFormatStarted
    )
  ) {
    return {
      ...state,
      exportStatus: 'inprogress',
      exportFormat: action.exportFormat,
    };
  }

  if (
    isAction<ChangeExportSchemaFormatErroredAction>(
      action,
      SchemaExportActions.changeExportSchemaFormatError
    )
  ) {
    return {
      ...state,
      errorMessage: action.errorMessage,
      exportStatus: 'error',
    };
  }

  if (
    isAction<ChangeExportSchemaFormatCompletedAction>(
      action,
      SchemaExportActions.changeExportSchemaFormatComplete
    )
  ) {
    return {
      ...state,
      exportedSchema: action.exportedSchema,
      exportStatus: 'complete',
    };
  }

  if (
    isAction<CancelExportSchemaAction>(
      action,
      SchemaExportActions.cancelExportSchema
    )
  ) {
    return {
      ...state,
      exportStatus: 'error',
      errorMessage: 'cancelled',
      abortController: undefined,
    };
  }

  return state;
};
