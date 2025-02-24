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
  isLegacyBannerOpen: boolean;
  legacyBannerChoice?: 'legacy' | 'export';
  exportedSchema?: string;
  exportFormat: SchemaFormat;
  errorMessage?: string;
  exportStatus: ExportStatus;
  filename?: string;
};

const defaultSchemaFormat: SchemaFormat = 'standardJSON';

const getInitialState = (): SchemaExportState => ({
  errorMessage: undefined,
  exportFormat: defaultSchemaFormat,
  exportStatus: 'inprogress',
  exportedSchema: undefined,
  isOpen: false,
  isLegacyBannerOpen: false,
  legacyBannerChoice: undefined,
});

export const enum SchemaExportActions {
  openExportSchema = 'schema-service/schema-export/openExportSchema',
  closeExportSchema = 'schema-service/schema-export/closeExportSchema',
  openLegacyBanner = 'schema-service/schema-export/openLegacyBanner',
  closeLegacyBanner = 'schema-service/schema-export/closeLegacyBanner',
  setLegacyBannerChoice = 'schema-service/schema-export/setLegacyBannerChoice',
  changeExportSchemaStatus = 'schema-service/schema-export/changeExportSchemaStatus',
  changeExportSchemaFormatStarted = 'schema-service/schema-export/changeExportSchemaFormatStarted',
  changeExportSchemaFormatComplete = 'schema-service/schema-export/changeExportSchemaFormatComplete',
  changeExportSchemaFormatError = 'schema-service/schema-export/changeExportSchemaFormatError',
  cancelExportSchema = 'schema-service/schema-export/cancelExportSchema',
  schemaDownloadReady = 'schema-service/schema-export/schemaDownloadReady',
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
  filename: string;
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

export const trackSchemaExportFailed = (
  stage: string
): SchemaThunkAction<void> => {
  return (dispatch, getState, { track, connectionInfoRef }) => {
    const { exportedSchema, exportFormat } = getState().schemaExport;
    track(
      'Schema Export Failed',
      {
        has_schema: !!exportedSchema,
        schema_length: exportedSchema?.length || 0,
        format: exportFormat,
        stage,
      },
      connectionInfoRef.current
    );
  };
};

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
    { logger: { log }, exportAbortControllerRef, schemaAccessorRef, namespace }
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
      dispatch(trackSchemaExportFailed('switching format'));
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

    const filename = `schema-${namespace.replace(
      '.',
      '-'
    )}-${exportFormat}.json`;

    dispatch({
      type: SchemaExportActions.changeExportSchemaFormatComplete,
      exportedSchema,
      filename,
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
    isAction<openLegacyBannerAction>(
      action,
      SchemaExportActions.openLegacyBanner
    )
  ) {
    return {
      ...state,
      isLegacyBannerOpen: true,
    };
  }

  if (
    isAction<closeLegacyBannerAction>(
      action,
      SchemaExportActions.closeLegacyBanner
    )
  ) {
    return {
      ...state,
      isLegacyBannerOpen: false,
    };
  }

  if (
    isAction<setLegacyBannerChoiceAction>(
      action,
      SchemaExportActions.setLegacyBannerChoice
    )
  ) {
    return {
      ...state,
      legacyBannerChoice: action.choice,
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
      filename: action.filename,
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

// TODO clean out when phase out is confirmed COMPASS-8692
export type openLegacyBannerAction = {
  type: SchemaExportActions.openLegacyBanner;
};

export const openLegacyBanner = (): SchemaThunkAction<void> => {
  return (dispatch, getState) => {
    const choiceInState = getState().schemaExport.legacyBannerChoice;
    const savedChoice = choiceInState || localStorage.getItem(localStorageId);
    if (savedChoice) {
      if (savedChoice !== choiceInState) {
        dispatch({
          type: SchemaExportActions.setLegacyBannerChoice,
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
    dispatch({ type: SchemaExportActions.openLegacyBanner });
  };
};

export type closeLegacyBannerAction = {
  type: SchemaExportActions.closeLegacyBanner;
};

export type setLegacyBannerChoiceAction = {
  type: SchemaExportActions.setLegacyBannerChoice;
  choice: 'legacy' | 'export';
};

const localStorageId = 'schemaExportLegacyBannerChoice';

export const switchToSchemaExport = (): SchemaThunkAction<void> => {
  return (dispatch) => {
    dispatch({ type: SchemaExportActions.closeLegacyBanner });
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
      dispatch({ type: SchemaExportActions.closeLegacyBanner });
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

export const stopShowingLegacyBanner = (
  choice: 'legacy' | 'export'
): SchemaThunkAction<void> => {
  return (dispatch) => {
    localStorage.setItem(localStorageId, choice);
    dispatch({ type: SchemaExportActions.setLegacyBannerChoice, choice });
  };
};
