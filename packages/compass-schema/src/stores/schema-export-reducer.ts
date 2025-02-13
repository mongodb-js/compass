import type { Action, Reducer } from 'redux';
import { mongoLogId } from '@mongodb-js/compass-logging/provider';
import type {
  StandardJSONSchema,
  InternalSchema,
  MongoDBJSONSchema,
  ExpandedJSONSchema,
} from 'mongodb-schema';

import type { SchemaThunkAction } from './store';
import { isAction } from '../utils';
import {
  calculateSchemaDepth,
  schemaContainsGeoData,
  type SchemaAccessor,
} from '../modules/schema-analysis';
import { openToast } from '@mongodb-js/compass-components';

export type SchemaFormat =
  | 'standardJSON'
  | 'mongoDBJSON'
  | 'extendedJSON'
  | 'legacyJSON';
export type ExportStatus = 'inprogress' | 'complete' | 'error';
export type SchemaExportState = {
  abortController?: AbortController;
  isOpen: boolean;
  isLegacyBannerOpen: boolean;
  legacyBannerChoice?: 'legacy' | 'export';
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
        mongoLogId(1_001_000_342),
        'Schema export formatting',
        'Formatting schema',
        {
          format: exportFormat,
        }
      );

      const schemaAccessor = getState().schemaAnalysis.schemaAccessor;
      if (!schemaAccessor) {
        throw new Error('No schema analysis available');
      }

      exportedSchema = await getSchemaByFormat({
        schemaAccessor,
        exportFormat,
        signal: abortController.signal,
      });
    } catch (err: any) {
      if (abortController.signal.aborted) {
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

    if (abortController.signal.aborted) {
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

//// TODO: add ticket number to clean this up
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
        dispatch(confirmedLegacySchemaShare());
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

export const confirmedLegacySchemaShare = (): SchemaThunkAction<void> => {
  return (dispatch, getState, { namespace }) => {
    const {
      schemaAnalysis: { schema },
    } = getState();
    const hasSchema = schema !== null;
    if (hasSchema) {
      void navigator.clipboard.writeText(JSON.stringify(schema, null, '  '));
    }
    dispatch(_trackSchemaShared(hasSchema));
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
            description: 'Please analyze the schema in the schema tab before sharing the schema.',
          }
    );
  };
};

export const _trackSchemaShared = (
  hasSchema: boolean
): SchemaThunkAction<void> => {
  return (dispatch, getState, { track, connectionInfoRef }) => {
    const {
      schemaAnalysis: { schema },
    } = getState();
    // Use a function here to a) ensure that the calculations here
    // are only made when telemetry is enabled and b) that errors from
    // those calculations are caught and logged rather than displayed to
    // users as errors from the core schema sharing logic.
    const trackEvent = () => ({
      has_schema: hasSchema,
      schema_width: schema?.fields?.length ?? 0,
      schema_depth: schema ? calculateSchemaDepth(schema) : 0,
      geo_data: schema ? schemaContainsGeoData(schema) : false,
    });
    track('Schema Exported', trackEvent, connectionInfoRef.current);
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
