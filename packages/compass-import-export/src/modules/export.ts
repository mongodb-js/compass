import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import { gatherFields } from '../export/gather-fields';
import type { RootExportState } from '../stores/export-store';
import type { SchemaPath } from '../export/gather-fields';
import type {
  ExportAggregation,
  ExportQuery,
  ExportResult,
} from '../export/export-types';
import { queryHasProjection } from '../utils/query-has-projection';

// TODO(COMPASS-6426): Update the fields to export type based on the gather fields result type.
export type FieldsToExport = {
  [fieldId: string]: {
    fieldPath: SchemaPath;
    selected: boolean;
  };
};

// Fields can only be prefixed with one '$'. Otherwise $
// is not allowed, so this should be a safe separator.
const FieldSplittingSymbol = '$$$$';
function getIdForSchemaPath(schemaPath: SchemaPath) {
  return schemaPath.join(FieldSplittingSymbol);
}
export function getLabelForFieldId(fieldId: string) {
  return fieldId.split(FieldSplittingSymbol).join('.');
}

export const selectFieldsToExport = createAsyncThunk<
  FieldsToExport,
  void,
  { state: RootExportState }
>(
  'export/select-fields-to-export',
  async (_, { getState, rejectWithValue }): Promise<FieldsToExport> => {
    const {
      export: { query, namespace, fieldsToExportAbortController },
      dataService: { dataService },
    } = getState();

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // TODO(COMPASS-6426): Update the interface of this method, pass the whole query.
    const schemaPaths = await gatherFields({
      ns: namespace,
      abortSignal: fieldsToExportAbortController?.signal,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      dataService: dataService!,
      filter: query?.filter || {},
      sampleSize: 10, // TODO: Decide default size.
    });

    // If aborted, or new abort controller, don't fulfill.
    if (fieldsToExportAbortController?.signal.aborted) {
      rejectWithValue('aborted');
    }

    const fields: FieldsToExport = {};
    for (const schemaPath of schemaPaths) {
      fields[getIdForSchemaPath(schemaPath)] = {
        fieldPath: schemaPath,
        selected: true,
      };
    }

    return fields;
  }
);

export const runExport = createAsyncThunk(
  'export/run-export',
  async (): Promise<ExportResult> => {
    // TODO(COMPASS-6580): Run export.

    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      docsWritten: 0,
      aborted: true,
    };
  }
);

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

export const exportSlice = createSlice({
  name: 'export',
  initialState,
  reducers: {
    openExport: (
      state,
      action: PayloadAction<
        Omit<ExportOptions, 'fieldsToExport' | 'selectedFieldOption'>
      >
    ) => {
      // When an export is already in progress show the in progress modal.
      if (state.status === 'in-progress') {
        state.isInProgressMessageOpen = true;
        return;
      }
      state.status =
        !!action.payload.aggregation ||
        !!action.payload.exportFullCollection ||
        !action.payload.query ||
        !!queryHasProjection(action.payload.query)
          ? 'ready-to-export'
          : 'select-field-options';
      state.isInProgressMessageOpen = false;
      state.isOpen = true;
      state.fieldsToExport = {};
      state.errorLoadingFieldsToExport = undefined;
      state.selectedFieldOption = undefined;
      state.namespace = action.payload.namespace;
      state.exportFullCollection = action.payload.exportFullCollection;
      state.query = action.payload.query;
      state.aggregation = action.payload.aggregation;
    },
    closeExport: (state) => {
      state.fieldsToExportAbortController?.abort();
      state.fieldsToExportAbortController = undefined;
      state.isOpen = false;
    },
    closeInProgressMessage: (state) => {
      state.isInProgressMessageOpen = false;
    },
    backToSelectFieldOptions: (state) => {
      state.fieldsToExportAbortController?.abort();
      state.fieldsToExportAbortController = undefined;
      state.selectedFieldOption = undefined;
      state.status = 'select-field-options';
    },
    backToSelectFieldsToExport: (state) => {
      state.status = 'select-fields-to-export';
    },
    updateSelectedFields: (state, action: PayloadAction<FieldsToExport>) => {
      state.fieldsToExport = action.payload;
    },
    readyToExport: (state, action: PayloadAction<'all-fields' | undefined>) => {
      if (action.payload === 'all-fields') {
        state.selectedFieldOption = 'all-fields';
      }
      state.status = 'ready-to-export';
    },
  },
  extraReducers: (builder) => {
    builder.addCase(selectFieldsToExport.pending, (state) => {
      state.selectedFieldOption = 'select-fields';
      state.errorLoadingFieldsToExport = undefined;
      state.status = 'select-fields-to-export';

      // Clear existing if it's in progress.
      state.fieldsToExportAbortController?.abort();
      state.fieldsToExportAbortController = new AbortController();
    });
    builder.addCase(selectFieldsToExport.rejected, (state, action) => {
      if (action.payload === 'aborted') {
        // Ignore when the selecting fields was cancelled.
        return;
      }
      state.errorLoadingFieldsToExport = action.error.message;
      state.fieldsToExportAbortController = undefined;
    });
    builder.addCase(selectFieldsToExport.fulfilled, (state, action) => {
      state.fieldsToExport = action.payload;
      state.fieldsToExportAbortController = undefined;
    });
    builder.addCase(runExport.pending, (state) => {
      // TODO(COMPASS-6580): Handle running export.
      alert('TODO(COMPASS-6580): export');
      state.fieldsToExportAbortController?.abort();
      state.fieldsToExportAbortController = undefined;
    });
    builder.addCase(runExport.rejected, () => {
      // TODO(COMPASS-6580)
    });
    builder.addCase(runExport.fulfilled, () => {
      // TODO(COMPASS-6580)
    });
    readyToExport;
  },
});

export const {
  openExport,
  closeExport,
  closeInProgressMessage,
  backToSelectFieldOptions,
  backToSelectFieldsToExport,
  updateSelectedFields,
  readyToExport,
} = exportSlice.actions;
export const exportReducer = exportSlice.reducer;
