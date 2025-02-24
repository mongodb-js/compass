import type { Action, Reducer } from 'redux';
import { mongoLogId } from '@mongodb-js/compass-logging/provider';
import type {
  StandardJSONSchema,
  InternalSchema,
  MongoDBJSONSchema,
  ExpandedJSONSchema,
  SchemaAccessor,
} from 'mongodb-schema';
import { openToast } from '@mongodb-js/compass-components';

import type { SchemaThunkAction } from './store';
import { isAction } from '../utils';
import { calculateSchemaMetadata } from '../modules/schema-analysis';

export type SchemaFormat =
  | 'standardJSON'
  | 'mongoDBJSON'
  | 'extendedJSON'
  | 'legacyJSON';
export type ExportStatus = 'inprogress' | 'complete' | 'error';
export type SchemaExportState = {
  isOpen: boolean;
  isLegacyModalOpen: boolean;
  legacyModalChoice?: 'legacy' | 'export';
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
  isLegacyModalOpen: false,
  legacyModalChoice: undefined,
});

export const enum SchemaExportActions {
  openExportSchema = 'schema-service/schema-export/openExportSchema',
  closeExportSchema = 'schema-service/schema-export/closeExportSchema',
  openLegacyModal = 'schema-service/schema-export/openLegacyModal',
  closeLegacyModal = 'schema-service/schema-export/closeLegacyModal',
  setLegacyModalChoice = 'schema-service/schema-export/setLegacyModalChoice',
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

const _trackSchemaExported = ({
  schema,
  source,
  format,
}: {
  schema: InternalSchema | null;
  source: 'app_menu' | 'schema_tab';
  format: SchemaFormat;
}): SchemaThunkAction<void> => {
  return (dispatch, getState, { track, connectionInfoRef }) => {
    // Use a function here to a) ensure that the calculations here
    // are only made when telemetry is enabled and b) that errors from
    // those calculations are caught and logged rather than displayed to
    // users as errors from the core schema sharing logic.
    const trackEvent = async () => {
      const { geo_data, schema_depth } = schema
        ? await calculateSchemaMetadata(schema)
        : {
            geo_data: false,
            schema_depth: 0,
          };

      return {
        has_schema: schema !== null,
        format,
        source,
        schema_width: schema?.fields?.length ?? 0,
        schema_depth,
        geo_data,
      };
    };
    track('Schema Exported', trackEvent, connectionInfoRef.current);
  };
};

export const trackSchemaExported = (): SchemaThunkAction<void> => {
  return (dispatch, getState) => {
    const {
      schemaAnalysis: { schema },
      schemaExport: { exportFormat },
    } = getState();
    dispatch(
      _trackSchemaExported({
        schema,
        format: exportFormat,
        source: 'schema_tab',
      })
    );
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

    log.info(
      mongoLogId(1_001_000_342),
      'Schema export formatting',
      'Formatting schema',
      {
        format: exportFormat,
      }
    );

    let exportedSchema: string;
    try {
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
    isAction<openLegacyModalAction>(action, SchemaExportActions.openLegacyModal)
  ) {
    return {
      ...state,
      isLegacyModalOpen: true,
    };
  }

  if (
    isAction<closeLegacyModalAction>(
      action,
      SchemaExportActions.closeLegacyModal
    )
  ) {
    return {
      ...state,
      isLegacyModalOpen: false,
    };
  }

  if (
    isAction<setLegacyModalChoiceAction>(
      action,
      SchemaExportActions.setLegacyModalChoice
    )
  ) {
    return {
      ...state,
      legacyModalChoice: action.choice,
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

// TODO(COMPASS-8692): clean out when phase out is confirmed.
export type openLegacyModalAction = {
  type: SchemaExportActions.openLegacyModal;
};

export const openLegacyModal = (): SchemaThunkAction<void> => {
  return (dispatch, getState) => {
    const choiceInState = getState().schemaExport.legacyModalChoice;
    const savedChoice = choiceInState || localStorage.getItem(localStorageId);
    if (savedChoice) {
      if (savedChoice !== choiceInState) {
        dispatch({
          type: SchemaExportActions.setLegacyModalChoice,
          choice: savedChoice,
        });
      }
      if (savedChoice === 'legacy') {
        dispatch(confirmedExportLegacySchemaToClipboard());
        return;
      }
      if (savedChoice === 'export') {
        dispatch(openExportSchema());
        return;
      }
    }
    dispatch({ type: SchemaExportActions.openLegacyModal });
  };
};

export type closeLegacyModalAction = {
  type: SchemaExportActions.closeLegacyModal;
};

export type setLegacyModalChoiceAction = {
  type: SchemaExportActions.setLegacyModalChoice;
  choice: 'legacy' | 'export';
};

const localStorageId = 'schemaExportLegacyModalChoice';

export const switchToSchemaExport = (): SchemaThunkAction<void> => {
  return (dispatch) => {
    dispatch({ type: SchemaExportActions.closeLegacyModal });
    dispatch(openExportSchema());
  };
};

export const confirmedExportLegacySchemaToClipboard =
  (): SchemaThunkAction<void> => {
    return (dispatch, getState, { namespace }) => {
      const {
        schemaAnalysis: { schema },
      } = getState();
      const hasSchema = schema !== null;
      if (hasSchema) {
        void navigator.clipboard.writeText(JSON.stringify(schema, null, '  '));
      }
      dispatch(
        _trackSchemaExported({
          schema,
          source: 'app_menu',
          format: 'legacyJSON',
        })
      );
      dispatch({ type: SchemaExportActions.closeLegacyModal });
      openToast(
        'share-schema',
        hasSchema
          ? {
              variant: 'success',
              title: 'Schema Copied',
              description: `The schema definition of ${namespace} has been copied to your clipboard in JSON format.`,
              timeout: 5_000,
            }
          : {
              variant: 'warning',
              title: 'Analyze Schema First',
              description:
                'Please analyze the schema in the schema tab before sharing the schema.',
            }
      );
    };
  };

export const stopShowingLegacyModal = (
  choice: 'legacy' | 'export'
): SchemaThunkAction<void> => {
  return (dispatch) => {
    localStorage.setItem(localStorageId, choice);
    dispatch({ type: SchemaExportActions.setLegacyModalChoice, choice });
  };
};
