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

export type FieldsToExport = {
  [fieldId: string]: {
    fieldPath: SchemaPath;
    selected: boolean;
  };
};

// Fields can only be prefixed with one '$'. Otherwise $
// is not allowed, so this should be a safe separator.
const SplittingSymbol = '$$$$';
function getIdForSchemaPath(schemaPath: SchemaPath) {
  return schemaPath.join(SplittingSymbol.toString());
}

export const selectFieldsToExport = createAsyncThunk<
  FieldsToExport,
  void,
  { state: RootExportState }
>(
  'export/select-fields-to-export',
  async (_, { getState }): Promise<FieldsToExport> => {
    const {
      export: { namespace, fieldsToExportAbortController },
      dataService: { dataService },
    } = getState();

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const schemaPaths = await gatherFields({
      ns: namespace,
      abortSignal: fieldsToExportAbortController?.signal,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      dataService: dataService!,
      // TODO: Query.
      // Don't need to do for aggregations.
      sampleSize: 10, // TODO: Decide default size.
    });

    // TODO: If aborted, or new abort controller, don't fulfill?
    if (fieldsToExportAbortController?.signal.aborted) {
      // TODO: Reject with value?
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
  errorLoadingFieldsToExport: string | undefined; // TODO: Display this error
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
      state.status = 'select-field-options';
    },
    backToSelectFieldsToExport: (state) => {
      state.status = 'select-fields-to-export';
    },
    updateSelectedFields: (state, action: PayloadAction<FieldsToExport>) => {
      state.fieldsToExport = action.payload;
    },
    readyToExport: (state) => {
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

      // TODO: If select fields to export lets load the fields to export.
      state.fieldsToExportAbortController = new AbortController();
    });
    builder.addCase(selectFieldsToExport.rejected, (state, action) => {
      if (state.fieldsToExportAbortController?.signal.aborted) {
        // todo
      }
      state.errorLoadingFieldsToExport = action.error.message;
      // TODO: If it was rejected because of aborted don't unset abort controller.
      // We can have a rejectedWithValue for that.
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
