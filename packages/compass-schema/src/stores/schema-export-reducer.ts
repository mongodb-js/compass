import type { Action, Reducer } from 'redux';
import { mongoLogId } from '@mongodb-js/compass-logging/provider';

import type { SchemaThunkAction } from './store';
import { isAction } from '../utils';

export type SchemaFormat =
  | 'standardJSON'
  | 'mongoDBJSON'
  | 'extendedJSON'
  | 'legacyJSON';
export type ExportStatus = 'inprogress' | 'complete' | 'error';
export type SchemaExportState = {
  abortController?: AbortController;
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
  return (dispatch, getState) => {
    const {
      schemaExport: { abortController },
    } = getState();
    abortController?.abort();

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
  abortController: AbortController;
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
  return (dispatch, getState) => {
    const {
      schemaExport: { abortController },
    } = getState();
    abortController?.abort();

    return dispatch({
      type: SchemaExportActions.cancelExportSchema,
    });
  };
};

export const changeExportSchemaFormat = (
  exportFormat: SchemaFormat
): SchemaThunkAction<
  Promise<void>,
  | ChangeExportSchemaFormatStartedAction
  | ChangeExportSchemaFormatErroredAction
  | ChangeExportSchemaFormatCompletedAction
> => {
  return async (dispatch, getState, { logger: { log } }) => {
    const {
      schemaExport: { abortController: existingAbortController },
    } = getState();

    // If we're already in progress we abort their current operation.
    existingAbortController?.abort();

    const abortController = new AbortController();

    dispatch({
      type: SchemaExportActions.changeExportSchemaFormatStarted,
      abortController,
      exportFormat,
    });

    let exportedSchema: string;
    try {
      log.info(
        mongoLogId(1_001_000_339),
        'Schema export formatting',
        'Formatting schema',
        {
          format: exportFormat,
        }
      );

      // TODO.
      await new Promise((resolve) => setTimeout(resolve, 1000));

      exportedSchema = JSON.stringify(getState().schemaAnalysis.schema);
    } catch (err: any) {
      if (abortController.signal.aborted) {
        return;
      }
      log.error(
        mongoLogId(1_001_000_340),
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

    if (abortController.signal.aborted) {
      return;
    }

    log.info(
      mongoLogId(1_001_000_341),
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
      abortController: action.abortController,
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
