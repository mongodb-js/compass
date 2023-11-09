import type { AnyAction, Reducer } from 'redux';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import fs from 'fs';
import _ from 'lodash';
import {
  createProjectionFromSchemaFields,
  gatherFieldsFromQuery,
} from '../export/gather-fields';
import type { SchemaPath } from '../export/gather-fields';
import type {
  ExportAggregation,
  ExportQuery,
  ExportResult,
} from '../export/export-types';
import { queryHasProjection } from '../utils/query-has-projection';
import {
  exportCSVFromAggregation,
  exportCSVFromQuery,
} from '../export/export-csv';
import type { CSVExportPhase } from '../export/export-csv';
import {
  showCompletedToast,
  showCancelledToast,
  showFailedToast,
  showInProgressToast,
  showStartingToast,
} from '../components/export-toast';
import {
  exportJSONFromAggregation,
  exportJSONFromQuery,
} from '../export/export-json';
import type { ExportJSONFormat } from '../export/export-json';
import type { ExportThunkAction } from '../stores/export-store';

const { track, log, mongoLogId, debug } = createLoggerAndTelemetry(
  'COMPASS-IMPORT-EXPORT-UI'
);

export type FieldsToExport = {
  [fieldId: string]: {
    path: SchemaPath;
    selected: boolean;
  };
};

export function getIdForSchemaPath(schemaPath: SchemaPath) {
  return JSON.stringify(schemaPath);
}

function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

type ExportOptions = {
  namespace: string;
  query: ExportQuery | undefined;
  exportFullCollection?: boolean;
  aggregation?: ExportAggregation;
  fieldsToExport: FieldsToExport;

  selectedFieldOption: FieldsToExportOption;
};

export type ExportStatus =
  | undefined
  | 'select-field-options'
  | 'select-fields-to-export'
  | 'ready-to-export'
  | 'select-file-output'
  | 'in-progress';
export type FieldsToExportOption = 'all-fields' | 'select-fields';

export type ExportState = {
  isOpen: boolean;
  isInProgressMessageOpen: boolean;
  status: ExportStatus;
  fieldsAddedCount: number; // For telemetry.
  errorLoadingFieldsToExport: string | undefined;
  fieldsToExportAbortController: AbortController | undefined;
  exportAbortController: AbortController | undefined;
  exportFileError: string | undefined;
} & ExportOptions;

export const initialState: ExportState = {
  isOpen: false,
  isInProgressMessageOpen: false,
  status: undefined,
  namespace: '',
  query: {
    filter: {},
  },
  fieldsAddedCount: 0,
  errorLoadingFieldsToExport: undefined,
  fieldsToExport: {},
  fieldsToExportAbortController: undefined,
  selectedFieldOption: 'all-fields',
  exportFullCollection: undefined,
  aggregation: undefined,
  exportAbortController: undefined,
  exportFileError: undefined,
};

export const enum ExportActionTypes {
  OpenExport = 'compass-import-export/export/OpenExport',
  CloseExport = 'compass-import-export/export/CloseExport',
  CloseInProgressMessage = 'compass-import-export/export/CloseInProgressMessage',
  BackToSelectFieldOptions = 'compass-import-export/export/BackToSelectFieldOptions',
  BackToSelectFieldsToExport = 'compass-import-export/export/BackToSelectFieldsToExport',
  ReadyToExport = 'compass-import-export/export/ReadyToExport',

  ToggleFieldToExport = 'compass-import-export/export/ToggleFieldToExport',
  AddFieldToExport = 'compass-import-export/export/AddFieldToExport',
  ToggleExportAllSelectedFields = 'compass-import-export/export/ToggleExportAllSelectedFields',

  SelectFieldsToExport = 'compass-import-export/export/SelectFieldsToExport',
  FetchFieldsToExport = 'compass-import-export/export/FetchFieldsToExport',
  FetchFieldsToExportSuccess = 'compass-import-export/export/FetchFieldsToExportSuccess',
  FetchFieldsToExportError = 'compass-import-export/export/FetchFieldsToExportError',

  RunExport = 'compass-import-export/export/RunExport',
  ExportFileError = 'compass-import-export/export/ExportFileError',
  CancelExport = 'compass-import-export/export/CancelExport',
  RunExportError = 'compass-import-export/export/RunExportError',
  RunExportSuccess = 'compass-import-export/export/RunExportSuccess',
}

type OpenExportAction = {
  type: ExportActionTypes.OpenExport;
  origin: 'menu' | 'crud-toolbar' | 'empty-state' | 'aggregations-toolbar';
} & Omit<ExportOptions, 'fieldsToExport' | 'selectedFieldOption'>;

export const openExport = (
  exportOptions: Omit<OpenExportAction, 'type'>
): OpenExportAction => ({
  type: ExportActionTypes.OpenExport,
  ...exportOptions,
});

type CloseExportAction = {
  type: ExportActionTypes.CloseExport;
};

export const closeExport = (): CloseExportAction => ({
  type: ExportActionTypes.CloseExport,
});

type CloseInProgressMessageAction = {
  type: ExportActionTypes.CloseInProgressMessage;
};

export const closeInProgressMessage = (): CloseInProgressMessageAction => ({
  type: ExportActionTypes.CloseInProgressMessage,
});

type SelectFieldsToExportAction = {
  type: ExportActionTypes.SelectFieldsToExport;
};

type BackToSelectFieldOptionsAction = {
  type: ExportActionTypes.BackToSelectFieldOptions;
};

export const backToSelectFieldOptions = (): BackToSelectFieldOptionsAction => ({
  type: ExportActionTypes.BackToSelectFieldOptions,
});

type BackToSelectFieldsToExportAction = {
  type: ExportActionTypes.BackToSelectFieldsToExport;
};

export const backToSelectFieldsToExport =
  (): BackToSelectFieldsToExportAction => ({
    type: ExportActionTypes.BackToSelectFieldsToExport,
  });

type FetchFieldsToExportAction = {
  type: ExportActionTypes.FetchFieldsToExport;
  fieldsToExportAbortController: AbortController;
};

type FetchFieldsToExportErrorAction = {
  type: ExportActionTypes.FetchFieldsToExportError;
  errorMessage?: string;
};

type FetchFieldsToExportSuccessAction = {
  type: ExportActionTypes.FetchFieldsToExportSuccess;
  fieldsToExport: FieldsToExport;
  aborted?: boolean;
};

type ToggleFieldToExportAction = {
  type: ExportActionTypes.ToggleFieldToExport;
  fieldId: string;
};
export const toggleFieldToExport = (fieldId: string) => ({
  type: ExportActionTypes.ToggleFieldToExport,
  fieldId,
});

type ToggleExportAllSelectedFieldsAction = {
  type: ExportActionTypes.ToggleExportAllSelectedFields;
};
export const toggleExportAllSelectedFields = () => ({
  type: ExportActionTypes.ToggleExportAllSelectedFields,
});

type AddFieldToExportAction = {
  type: ExportActionTypes.AddFieldToExport;
  path: SchemaPath;
};
export const addFieldToExport = (path: SchemaPath) => ({
  type: ExportActionTypes.AddFieldToExport,
  path,
});

type ReadyToExportAction = {
  type: ExportActionTypes.ReadyToExport;
  selectedFieldOption?: 'all-fields';
};

export const readyToExport = (): ReadyToExportAction => ({
  type: ExportActionTypes.ReadyToExport,
});

type ExportFileErrorAction = {
  type: ExportActionTypes.ExportFileError;
  errorMessage: string;
};

type RunExportAction = {
  type: ExportActionTypes.RunExport;
  exportAbortController: AbortController;
};

type CancelExportAction = {
  type: ExportActionTypes.CancelExport;
};

export const cancelExport = (): CancelExportAction => ({
  type: ExportActionTypes.CancelExport,
});

type RunExportErrorAction = {
  type: ExportActionTypes.RunExportError;
  error: Error;
};

type RunExportSuccessAction = {
  type: ExportActionTypes.RunExportSuccess;
  aborted: boolean;
};

export const selectFieldsToExport = (): ExportThunkAction<
  Promise<void>,
  | SelectFieldsToExportAction
  | FetchFieldsToExportAction
  | FetchFieldsToExportErrorAction
  | FetchFieldsToExportSuccessAction
> => {
  return async (dispatch, getState, { dataService }) => {
    dispatch({
      type: ExportActionTypes.SelectFieldsToExport,
    });

    const fieldsToExportAbortController = new AbortController();

    dispatch({
      type: ExportActionTypes.FetchFieldsToExport,
      fieldsToExportAbortController,
    });

    const {
      export: { query, namespace },
    } = getState();

    let gatherFieldsResult: Awaited<ReturnType<typeof gatherFieldsFromQuery>>;

    try {
      gatherFieldsResult = await gatherFieldsFromQuery({
        ns: namespace,
        abortSignal: fieldsToExportAbortController.signal,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        dataService: dataService,
        query,
        sampleSize: 50,
      });
    } catch (err: any) {
      log.error(
        mongoLogId(1_001_000_184),
        'Export',
        'Failed to gather fields for selecting for export',
        err
      );
      dispatch({
        type: ExportActionTypes.FetchFieldsToExportError,
        errorMessage: err?.message,
      });
      return;
    }

    const fields: FieldsToExport = {};
    for (const schemaPath of gatherFieldsResult.paths) {
      fields[getIdForSchemaPath(schemaPath)] = {
        path: schemaPath,
        // We start all of the fields as unchecked.
        selected: false,
      };
    }

    dispatch({
      type: ExportActionTypes.FetchFieldsToExportSuccess,
      fieldsToExport: fields,
      aborted:
        fieldsToExportAbortController.signal.aborted ||
        gatherFieldsResult.aborted,
    });
  };
};

export const runExport = ({
  filePath,
  fileType,
  jsonFormatVariant,
}: {
  filePath: string;
  fileType: 'csv' | 'json';
  jsonFormatVariant: ExportJSONFormat;
}): ExportThunkAction<Promise<void>> => {
  return async (dispatch, getState, { dataService }) => {
    let outputWriteStream: fs.WriteStream;
    try {
      outputWriteStream = fs.createWriteStream(filePath);
    } catch (err: any) {
      dispatch({
        type: ExportActionTypes.ExportFileError,
        errorMessage: err?.message || 'Error creating output file.',
      });
      return;
    }

    const startTime = Date.now();

    const {
      export: {
        query: _query,
        namespace,
        fieldsToExport,
        aggregation,
        exportFullCollection,
        selectedFieldOption,
        fieldsAddedCount,
      },
    } = getState();

    let fieldsIncludedCount = 0;
    let fieldsExcludedCount = 0;

    const query =
      exportFullCollection || aggregation
        ? {
            filter: {},
          }
        : selectedFieldOption === 'select-fields'
        ? {
            ...(_query ?? {
              filter: {},
            }),
            projection: createProjectionFromSchemaFields(
              Object.values(fieldsToExport)
                .filter((field) => {
                  field.selected
                    ? fieldsIncludedCount++
                    : fieldsExcludedCount++;

                  return field.selected;
                })
                .map((field) => field.path)
            ),
          }
        : _query;

    log.info(mongoLogId(1_001_000_185), 'Export', 'Start export', {
      namespace,
      filePath,
      fileType,
      exportFullCollection,
      jsonFormatVariant,
      fieldsToExport,
      aggregation,
      query,
      selectedFieldOption,
    });

    const exportAbortController = new AbortController();

    dispatch({
      type: ExportActionTypes.RunExport,
      exportAbortController,
    });

    showStartingToast({
      cancelExport: () => dispatch(cancelExport()),
      namespace,
    });

    let exportSucceeded = false;

    const progressCallback = _.throttle(function (
      index: number,
      csvPhase?: CSVExportPhase
    ) {
      showInProgressToast({
        cancelExport: () => dispatch(cancelExport()),
        docsWritten: index,
        filePath,
        namespace,
        csvPhase,
      });
    },
    1000);

    let promise: Promise<ExportResult>;

    const baseExportOptions = {
      ns: namespace,
      abortSignal: exportAbortController.signal,
      dataService: dataService,
      progressCallback,
      output: outputWriteStream,
    };

    if (aggregation) {
      if (fileType === 'csv') {
        promise = exportCSVFromAggregation({
          ...baseExportOptions,
          aggregation,
        });
      } else {
        promise = exportJSONFromAggregation({
          ...baseExportOptions,
          aggregation,
          variant: jsonFormatVariant,
        });
      }
    } else {
      if (fileType === 'csv') {
        promise = exportCSVFromQuery({
          ...baseExportOptions,
          query,
        });
      } else {
        promise = exportJSONFromQuery({
          ...baseExportOptions,
          query,
          variant: jsonFormatVariant,
        });
      }
    }

    let exportResult: ExportResult | undefined;
    try {
      exportResult = await promise;

      log.info(mongoLogId(1_001_000_186), 'Export', 'Finished export', {
        namespace,
        docsWritten: exportResult.docsWritten,
        filePath,
      });

      exportSucceeded = true;
      progressCallback.flush();
    } catch (err: any) {
      debug('Error while exporting:', err.stack);
      log.error(mongoLogId(1_001_000_187), 'Export', 'Export failed', {
        namespace,
        error: (err as Error)?.message,
      });
      dispatch({
        type: ExportActionTypes.RunExportError,
        error: err,
      });
      showFailedToast(err);
    } finally {
      outputWriteStream.close();
    }

    const aborted = !!(
      exportAbortController.signal.aborted || exportResult?.aborted
    );
    track('Export Completed', {
      type: aggregation ? 'aggregation' : 'query',
      all_docs: exportFullCollection,
      has_projection:
        exportFullCollection || aggregation || !_query
          ? undefined
          : queryHasProjection(_query),
      field_option:
        exportFullCollection ||
        aggregation ||
        (_query && queryHasProjection(_query))
          ? undefined
          : selectedFieldOption,
      file_type: fileType,
      json_format: fileType === 'json' ? jsonFormatVariant : undefined,
      field_count:
        selectedFieldOption === 'select-fields'
          ? fieldsIncludedCount
          : undefined,
      fields_added_count:
        selectedFieldOption === 'select-fields' ? fieldsAddedCount : undefined,
      fields_not_selected_count:
        selectedFieldOption === 'select-fields'
          ? fieldsExcludedCount
          : undefined,
      number_of_docs: exportResult?.docsWritten,
      success: exportSucceeded,
      stopped: aborted,
      duration: Date.now() - startTime,
    });

    if (!exportSucceeded) {
      return;
    }

    if (exportResult?.aborted) {
      showCancelledToast({
        docsWritten: exportResult?.docsWritten ?? 0,
        filePath,
      });
    } else {
      showCompletedToast({
        docsWritten: exportResult?.docsWritten ?? 0,
        filePath,
      });
    }

    dispatch({
      type: ExportActionTypes.RunExportSuccess,
      aborted,
    });
  };
};

export const exportReducer: Reducer<ExportState> = (
  state = initialState,
  action
) => {
  if (isAction<OpenExportAction>(action, ExportActionTypes.OpenExport)) {
    // When an export is already in progress show the in progress modal.
    if (state.status === 'in-progress') {
      return {
        ...state,
        isInProgressMessageOpen: true,
      };
    }

    track('Export Opened', {
      type: action.aggregation ? 'aggregation' : 'query',
      origin: action.origin,
    });

    return {
      ...initialState,
      status:
        !!action.aggregation ||
        !!action.exportFullCollection ||
        !action.query ||
        !!queryHasProjection(action.query)
          ? 'ready-to-export'
          : 'select-field-options',
      isInProgressMessageOpen: false,
      isOpen: true,
      fieldsAddedCount: 0,
      fieldsToExport: {},
      errorLoadingFieldsToExport: undefined,
      selectedFieldOption: 'all-fields',
      exportFileError: undefined,
      namespace: action.namespace,
      exportFullCollection: action.exportFullCollection,
      query: action.query,
      aggregation: action.aggregation,
    };
  }

  if (isAction<CloseExportAction>(action, ExportActionTypes.CloseExport)) {
    // Cancel any ongoing operations.
    state.fieldsToExportAbortController?.abort();
    state.exportAbortController?.abort();
    return {
      ...state,
      isOpen: false,
    };
  }

  if (
    isAction<CloseInProgressMessageAction>(
      action,
      ExportActionTypes.CloseInProgressMessage
    )
  ) {
    return {
      ...state,
      isInProgressMessageOpen: false,
    };
  }

  if (
    isAction<SelectFieldsToExportAction>(
      action,
      ExportActionTypes.SelectFieldsToExport
    )
  ) {
    return {
      ...state,
      errorLoadingFieldsToExport: undefined,
      selectedFieldOption: 'select-fields',
      status: 'select-fields-to-export',
    };
  }

  if (
    isAction<FetchFieldsToExportAction>(
      action,
      ExportActionTypes.FetchFieldsToExport
    )
  ) {
    state.fieldsToExportAbortController?.abort();
    return {
      ...state,
      fieldsToExportAbortController: action.fieldsToExportAbortController,
    };
  }

  if (
    isAction<FetchFieldsToExportErrorAction>(
      action,
      ExportActionTypes.FetchFieldsToExportError
    )
  ) {
    return {
      ...state,
      errorLoadingFieldsToExport: action.errorMessage,
      fieldsToExportAbortController: undefined,
    };
  }

  if (
    isAction<FetchFieldsToExportSuccessAction>(
      action,
      ExportActionTypes.FetchFieldsToExportSuccess
    )
  ) {
    if (action.aborted) {
      // Ignore when the selecting fields was cancelled.
      // Currently we don't let the user intentionally skip fetching fields, so an abort
      // would come from closing the modal or performing a different way of exporting.
      return state;
    }

    return {
      ...state,
      fieldsToExport: action.fieldsToExport,
      fieldsToExportAbortController: undefined,
    };
  }

  if (
    isAction<BackToSelectFieldOptionsAction>(
      action,
      ExportActionTypes.BackToSelectFieldOptions
    )
  ) {
    state.fieldsToExportAbortController?.abort();

    return {
      ...state,
      fieldsToExportAbortController: undefined,
      status: 'select-field-options',
    };
  }

  if (
    isAction<BackToSelectFieldsToExportAction>(
      action,
      ExportActionTypes.BackToSelectFieldsToExport
    )
  ) {
    return {
      ...state,
      status: 'select-fields-to-export',
    };
  }

  if (
    isAction<ToggleFieldToExportAction>(
      action,
      ExportActionTypes.ToggleFieldToExport
    )
  ) {
    return {
      ...state,
      fieldsToExport: {
        ...state.fieldsToExport,
        [action.fieldId]: {
          ...state.fieldsToExport[action.fieldId],
          selected: !state.fieldsToExport[action.fieldId].selected,
        },
      },
    };
  }

  if (
    isAction<AddFieldToExportAction>(action, ExportActionTypes.AddFieldToExport)
  ) {
    return {
      ...state,
      fieldsAddedCount: state.fieldsAddedCount,
      fieldsToExport: {
        ...state.fieldsToExport,
        [getIdForSchemaPath(action.path)]: {
          path: action.path,
          selected: true,
        },
      },
    };
  }

  if (
    isAction<ToggleExportAllSelectedFieldsAction>(
      action,
      ExportActionTypes.ToggleExportAllSelectedFields
    )
  ) {
    const newFieldsToExport: FieldsToExport = {};

    const areAllSelected = Object.values(state.fieldsToExport).every(
      (field) => field.selected
    );

    Object.entries(state.fieldsToExport).map(([fieldId, field]) => {
      newFieldsToExport[fieldId] = {
        ...field,
        selected: !areAllSelected,
      };
    });

    return {
      ...state,
      fieldsToExport: newFieldsToExport,
    };
  }

  if (isAction<ReadyToExportAction>(action, ExportActionTypes.ReadyToExport)) {
    return {
      ...state,
      status: 'ready-to-export',
      selectedFieldOption:
        action.selectedFieldOption === 'all-fields'
          ? action.selectedFieldOption
          : state.selectedFieldOption,
    };
  }

  if (isAction<RunExportAction>(action, ExportActionTypes.RunExport)) {
    state.fieldsToExportAbortController?.abort();
    state.exportAbortController?.abort();
    return {
      ...state,
      isOpen: false,
      status: 'in-progress',
      exportAbortController: action.exportAbortController,
    };
  }

  if (
    isAction<ExportFileErrorAction>(action, ExportActionTypes.ExportFileError)
  ) {
    return {
      ...state,
      exportFileError: action.errorMessage,
    };
  }

  if (isAction<CancelExportAction>(action, ExportActionTypes.CancelExport)) {
    state.exportAbortController?.abort();
    return {
      ...state,
      exportAbortController: undefined,
    };
  }

  if (
    isAction<RunExportErrorAction>(action, ExportActionTypes.RunExportError)
  ) {
    return {
      ...state,
      status: undefined,
      exportAbortController: undefined,
    };
  }

  if (
    isAction<RunExportSuccessAction>(action, ExportActionTypes.RunExportSuccess)
  ) {
    return {
      ...state,
      status: undefined,
      exportAbortController: undefined,
    };
  }

  return state;
};
