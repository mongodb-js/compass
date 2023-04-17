import type { Action, AnyAction, Reducer } from 'redux';
import { combineReducers } from 'redux';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';

import { gatherFieldsFromQuery } from '../export/gather-fields';
import type { SchemaPath } from '../export/gather-fields';
import type { ExportAggregation, ExportQuery } from '../export/export-types';
import { queryHasProjection } from '../utils/query-has-projection';
import { globalAppRegistry, dataService } from '../modules/compass';

const { track } = createLoggerAndTelemetry('COMPASS-IMPORT-EXPORT-UI');

export type FieldsToExport = {
  [fieldId: string]: {
    path: SchemaPath;
    selected: boolean;
  };
};

// Fields can only be prefixed with one '$'. Otherwise $
// is not allowed, so this should be a safe separator.
const FieldSplittingSymbol = '$$$$';
export function getIdForSchemaPath(schemaPath: SchemaPath) {
  return schemaPath.join(FieldSplittingSymbol);
}
export function getLabelForFieldId(fieldId: string) {
  return fieldId.split(FieldSplittingSymbol).join('.');
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

  selectedFieldOption: undefined | FieldsToExportOption;
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
  errorLoadingFieldsToExport: string | undefined;
  fieldsToExportAbortController: AbortController | undefined;
} & ExportOptions;

const initialState: ExportState = {
  isOpen: false,
  isInProgressMessageOpen: false,
  status: undefined,
  namespace: '',
  query: {
    filter: {},
  },
  errorLoadingFieldsToExport: undefined,
  fieldsToExport: {},
  fieldsToExportAbortController: undefined,
  selectedFieldOption: undefined,
  exportFullCollection: undefined,
  aggregation: undefined,
};

const enum ExportActionTypes {
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
}

type OpenExportAction = {
  type: ExportActionTypes.OpenExport;
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

export const closeInProgressMessage = (): CloseExportAction => ({
  type: ExportActionTypes.CloseExport,
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
  aborted?: boolean;
  errorMessage?: string;
};

type FetchFieldsToExportSuccessAction = {
  type: ExportActionTypes.FetchFieldsToExportSuccess;
  fieldsToExport: FieldsToExport;
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

type RunExportAction = {
  type: ExportActionTypes.RunExport;
};

export const selectFieldsToExport = (): ExportThunkAction<
  Promise<void>,
  | SelectFieldsToExportAction
  | FetchFieldsToExportAction
  | FetchFieldsToExportErrorAction
  | FetchFieldsToExportSuccessAction
> => {
  return async (dispatch, getState) => {
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
      dataService: { dataService },
    } = getState();

    try {
      const gatherFieldsResult = await gatherFieldsFromQuery({
        ns: namespace,
        abortSignal: fieldsToExportAbortController.signal,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        dataService: dataService!,
        query,
        sampleSize: 50,
      });

      if (
        fieldsToExportAbortController.signal.aborted ||
        gatherFieldsResult.aborted
      ) {
        dispatch({
          type: ExportActionTypes.FetchFieldsToExportError,
          aborted: true,
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
      });
    } catch (err: any) {
      if (fieldsToExportAbortController.signal.aborted) {
        dispatch({
          type: ExportActionTypes.FetchFieldsToExportError,
          aborted: true,
        });
        return;
      }

      dispatch({
        type: ExportActionTypes.FetchFieldsToExportError,
        errorMessage: err?.message,
      });
    }
  };
};

export const runExport = (): ExportThunkAction<
  Promise<void>,
  RunExportAction
> => {
  return async (dispatch) => {
    // TODO(COMPASS-6580): Run export.

    await new Promise((resolve) => setTimeout(resolve, 1000));

    dispatch({
      type: ExportActionTypes.RunExport,
    });
  };
};

const exportReducer: Reducer<ExportState> = (state = initialState, action) => {
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
      fieldsToExport: {},
      errorLoadingFieldsToExport: undefined,
      selectedFieldOption: undefined,
      namespace: action.namespace,
      exportFullCollection: action.exportFullCollection,
      query: action.query,
      aggregation: action.aggregation,
    };
  }

  if (isAction<CloseExportAction>(action, ExportActionTypes.CloseExport)) {
    // Cancel any ongoing operations.
    state.fieldsToExportAbortController?.abort();
    return {
      ...state,
      fieldsToExportAbortController: undefined,
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
    if (action.aborted) {
      // Ignore when the selecting fields was cancelled.
      return state;
    }

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
      selectedFieldOption: undefined,
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
    // TODO: Check if this is inside of a field that is already exported or toggled off.
    // We should toggle the parent on in if it is toggled off.
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
    // TODO: Check if this is inside of a field that is already exported or toggled off.
    // We should toggle the parent on in if it is toggled off.
    return {
      ...state,
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
    return {
      ...state,
      isOpen: false,
    };
  }

  return state;
};

const rootExportReducer = combineReducers({
  export: exportReducer,
  globalAppRegistry,
  dataService,
});

export type RootState = ReturnType<typeof rootExportReducer>;

export type ExportThunkDispatch<A extends Action = AnyAction> = ThunkDispatch<
  RootState,
  void,
  A
>;

export type ExportThunkAction<R, A extends Action = AnyAction> = ThunkAction<
  R,
  RootState,
  void,
  A
>;

export { rootExportReducer };
