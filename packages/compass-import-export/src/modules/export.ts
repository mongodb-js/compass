import throttle from 'lodash/throttle';
import { capMaxTimeMSAtPreferenceLimit } from 'compass-preferences-model';
import fs from 'fs';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';
import type { AnyAction, Dispatch } from 'redux';
import type { AggregateOptions, Document } from 'mongodb';
import type { DataService } from 'mongodb-data-service';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';

import PROCESS_STATUS from '../constants/process-status';
import EXPORT_STEP from '../constants/export-step';
import { globalAppRegistryEmit, nsChanged } from './compass';
import { loadFields, getSelectableFields } from './load-fields';
import { CursorExporter } from './cursor-exporter';
import type { AcceptedFileType } from '../constants/file-types';
import type { ProcessStatus } from '../constants/process-status';
import type { ExportStep } from '../constants/export-step';
import type { RootExportState } from '../stores/export-store';

const { log, mongoLogId, debug, track } = createLoggerAndTelemetry(
  'COMPASS-IMPORT-EXPORT-UI'
);

const PREFIX = 'import-export/export';

export const STARTED = `${PREFIX}/STARTED`;
export const CANCELED = `${PREFIX}/CANCELED`;

export const PROGRESS = `${PREFIX}/PROGRESS`;
export const FINISHED = `${PREFIX}/FINISHED`;
export const ERROR = `${PREFIX}/ERROR`;

export const SELECT_FILE_TYPE = `${PREFIX}/SELECT_FILE_TYPE`;
export const SELECT_FILE_NAME = `${PREFIX}/SELECT_FILE_NAME`;

export const ON_MODAL_OPEN = `${PREFIX}/ON_MODAL_OPEN`;
export const CLOSE = `${PREFIX}/CLOSE`;

export const CHANGE_EXPORT_STEP = `${PREFIX}/CHANGE_EXPORT_STEP`;

export const UPDATE_ALL_FIELDS = `${PREFIX}/UPDATE_ALL_FIELDS`;
export const UPDATE_SELECTED_FIELDS = `${PREFIX}/UPDATE_SELECTED_FIELDS`;

export const QUERY_CHANGED = `${PREFIX}/QUERY_CHANGED`;
export const TOGGLE_FULL_COLLECTION = `${PREFIX}/TOGGLE_FULL_COLLECTION`;

export const RESET = `${PREFIX}/RESET`;

export type ExportQueryType = {
  filter?: Record<string, unknown>;
  project?: Record<string, unknown>;
  limit?: number;
  skip?: number;
};

type ExportAggregationType = {
  stages: Document[];
  options: AggregateOptions;
};

/**
 * A full collection query.
 */
const FULL_QUERY: ExportQueryType = {
  filter: {},
};

type ExportFieldsType = Record<string, boolean>;

type State = {
  isOpen?: boolean;
  error?: Error | null;
  count: number | null;
  fileType: AcceptedFileType;
  fileName: string;
  ns: string; // Namespace
  query: ExportQueryType | null;
  status: ProcessStatus;
  fields: ExportFieldsType;
  allFields: ExportFieldsType;
  exportedDocsCount?: number;
  progress: number; // Progress percentage.
  exportStep: ExportStep;
  isFullCollection: boolean;
  aggregation?: ExportAggregationType | null;

  exporter?: CursorExporter;
  dest?: fs.WriteStream;
};

const INITIAL_STATE: State = {
  isOpen: false,
  exportStep: EXPORT_STEP.QUERY,
  isFullCollection: false,
  progress: 0,
  query: null,
  error: null,
  ns: '',
  fields: {},
  allFields: {},
  fileName: '',
  fileType: 'json',
  status: PROCESS_STATUS.UNSPECIFIED,
  exportedDocsCount: 0,
  count: 0,
  aggregation: null,
};

export const onStarted = (
  exporter: CursorExporter,
  dest: fs.WriteStream,
  count: number | null
) => ({
  type: STARTED,
  exporter: exporter,
  dest: dest,
  count: count,
});

export const onProgress = (progress: number, exportedDocsCount: number) => ({
  type: PROGRESS,
  progress: progress,
  exportedDocsCount: exportedDocsCount,
});

export const onFinished = (exportedDocsCount: number) => ({
  type: FINISHED,
  exportedDocsCount: exportedDocsCount,
});

export const onError = (error: Error) => ({
  type: ERROR,
  error: error,
});

export const reset = () => {
  return { type: RESET };
};

const reducer = (state: State = INITIAL_STATE, action: AnyAction): State => {
  if (action.type === RESET) {
    return { ...INITIAL_STATE };
  }

  if (action.type === TOGGLE_FULL_COLLECTION) {
    return {
      ...state,
      isFullCollection: !state.isFullCollection,
    };
  }

  if (action.type === ON_MODAL_OPEN) {
    const newState = {
      ...INITIAL_STATE,
      count: action.count,
      query: action.query || null,
      aggregation: action.aggregation || null,
      isOpen: true,
    };

    if (action.aggregation) {
      newState.exportStep = EXPORT_STEP.FILETYPE;
    }
    return newState;
  }

  if (action.type === CLOSE) {
    return {
      ...state,
      isOpen: false,
    };
  }

  if (action.type === STARTED) {
    return {
      ...state,
      error: null,
      progress: 0,
      status: PROCESS_STATUS.STARTED,
      exporter: action.exporter,
      dest: action.dest,
      count: action.count,
    };
  }

  if (action.type === PROGRESS) {
    return {
      ...state,
      progress: action.progress,
      exportedDocsCount: action.exportedDocsCount,
    };
  }

  if (action.type === FINISHED) {
    const isComplete = !(
      state.error || state.status === PROCESS_STATUS.CANCELED
    );
    return {
      ...state,
      status: isComplete ? PROCESS_STATUS.COMPLETED : state.status,
      exportedDocsCount: action.exportedDocsCount,
      exporter: undefined,
      dest: undefined,
    };
  }

  if (action.type === CANCELED) {
    return {
      ...state,
      status: PROCESS_STATUS.CANCELED,
      exporter: undefined,
      dest: undefined,
    };
  }

  if (action.type === UPDATE_SELECTED_FIELDS) {
    return {
      ...state,
      fields: action.fields,
    };
  }

  if (action.type === UPDATE_ALL_FIELDS) {
    return {
      ...state,
      allFields: action.fields,
    };
  }

  if (action.type === SELECT_FILE_NAME) {
    return {
      ...state,
      fileName: action.fileName,
      status: PROCESS_STATUS.UNSPECIFIED,
      exportedDocsCount: 0,
      exporter: undefined,
      dest: undefined,
    };
  }

  if (action.type === SELECT_FILE_TYPE) {
    return {
      ...state,
      fileType: action.fileType,
    };
  }

  if (action.type === CHANGE_EXPORT_STEP) {
    return {
      ...state,
      exportStep: action.status,
    };
  }

  if (action.type === ERROR) {
    return {
      ...state,
      error: action.error,
      status: PROCESS_STATUS.FAILED,
    };
  }

  return state;
};

/**
 * Toggle the full collection flag.
 * @api public
 */
export const toggleFullCollection = () => ({
  type: TOGGLE_FULL_COLLECTION,
});

/**
 * Select the file type of the export.
 */
export const selectExportFileType = (fileType: AcceptedFileType) => ({
  type: SELECT_FILE_TYPE,
  fileType: fileType,
});

/**
 * Select the file name to export to
 */
export const selectExportFileName = (fileName: string) => ({
  type: SELECT_FILE_NAME,
  fileName: fileName,
});

/**
 * Change the query.
 */
export const queryChanged = (query: ExportQueryType) => ({
  type: QUERY_CHANGED,
  query: query,
});

/**
 * Populate export modal data on open.
 */
export const onModalOpen = ({
  namespace,
  count,
  query,
  aggregation,
}: {
  namespace: string;
  query?: ExportQueryType;
  count?: number | null;
  aggregation?: ExportAggregationType;
}) => ({
  type: ON_MODAL_OPEN,
  namespace,
  count,
  query,
  aggregation,
});

/**
 * Close the export modal.
 * @api public
 */
export const closeExport = () => ({
  type: CLOSE,
});

/**
 * Update export fields (list of truncated, selectable field names)
 * @api public
 * @param {Object} fields: currently selected/disselected fields to be exported
 */
export const updateSelectedFields = (fields: ExportFieldsType) => ({
  type: UPDATE_SELECTED_FIELDS,
  fields: fields,
});

/**
 * Update export fields (list of full field names)
 * @api public
 * @param {Object} fields: currently selected/disselected fields to be exported
 */
export const updateAllFields = (fields: ExportFieldsType) => ({
  type: UPDATE_ALL_FIELDS,
  fields: fields,
});

/**
 * Select fields to be exported
 * @api public
 * @param {String} status: next step in export
 */
export const changeExportStep = (step: ExportStep) => ({
  type: CHANGE_EXPORT_STEP,
  status: step,
});

const fetchDocumentCount = async (
  dataService: DataService,
  ns: string,
  query: ExportQueryType
) => {
  // When there is no filter/limit/skip try to use the estimated count.
  if (
    (!query.filter || Object.keys(query.filter).length < 1) &&
    !query.limit &&
    !query.skip
  ) {
    try {
      const count = await dataService.estimatedCount(ns, {});
      return count;
    } catch (estimatedCountErr) {
      // `estimatedDocumentCount` is currently unsupported for
      // views and time-series collections, so we can fallback to a full
      // count in these cases and ignore this error.
    }
  }

  const count = dataService.count(ns, query.filter || {}, {
    ...(query.limit ? { limit: query.limit } : {}),
    ...(query.skip ? { skip: query.skip } : {}),
  });
  return count;
};

/**
 * Open the export modal.
 * Counts the documents to be exported given the current query on modal open to
 * provide user with accurate export data
 *
 * @api public
 */
export const openExport =
  ({
    namespace,
    query,
    count: maybeCount,
    aggregation,
  }: {
    namespace: string;
    query: ExportQueryType;
    // Optional pre supplied count to shortcut and
    // avoid a possibly expensive re-count.
    count?: number;
    aggregation?: ExportAggregationType;
  }): ThunkAction<void, RootExportState, void, AnyAction> =>
  async (
    dispatch: ThunkDispatch<RootExportState, void, AnyAction>,
    getState: () => RootExportState
  ) => {
    const isAggregation = !!aggregation;
    track('Export Opened', { type: isAggregation ? 'aggregation' : 'query' });
    const {
      dataService: { dataService },
    } = getState();

    let count = null;
    try {
      count =
        maybeCount ??
        (!isAggregation
          ? await fetchDocumentCount(dataService!, namespace, query)
          : null);
    } catch (e: unknown) {
      dispatch(onError(e as Error));
    }
    dispatch(nsChanged(namespace));
    dispatch(onModalOpen({ namespace, query, count, aggregation }));
  };

const getQuery = (query: ExportQueryType | null, isFullCollection: boolean) => {
  if (isFullCollection || !query) {
    return FULL_QUERY;
  }
  return query;
};

export const sampleFields =
  (): ThunkAction<void, RootExportState, void, AnyAction> =>
  async (
    dispatch: ThunkDispatch<RootExportState, void, AnyAction>,
    getState: () => RootExportState
  ) => {
    const {
      ns,
      exportData,
      dataService: { dataService },
    } = getState();

    const spec = getQuery(exportData.query, exportData.isFullCollection);

    try {
      const allFields = await loadFields(dataService!, ns, {
        filter: spec.filter,
        sampleSize: 50,
      });
      const selectedFields = getSelectableFields(allFields, {
        maxDepth: 2,
      });

      dispatch(updateAllFields(allFields));
      dispatch(updateSelectedFields(selectedFields));
    } catch (err) {
      // ignoring the error here so users can still insert
      // fields manually
      debug('failed to load fields', err);
    }
  };

/**
 * Run the actual export to file.
 * @api public
 */
export const startExport =
  (): ThunkAction<void, RootExportState, void, AnyAction> =>
  async (
    dispatch: ThunkDispatch<RootExportState, void, AnyAction>,
    getState: () => RootExportState
  ) => {
    const {
      ns,
      exportData,
      dataService: { dataService },
    } = getState();

    let exportSucceded = true;

    let numDocsActuallyExported = 0;
    const { columns, source, numDocsToExport } = await getExportSource(
      dataService!,
      ns,
      exportData
    );
    try {
      const dest = fs.createWriteStream(exportData.fileName);
      debug('executing pipeline');
      const exporter = new CursorExporter({
        cursor: source,
        type: exportData.fileType,
        columns: columns,
        output: dest,
        totalNumberOfDocuments: numDocsToExport,
      });

      const throttledProgress = throttle(
        ({
          percentage,
          transferred,
        }: {
          percentage: number;
          transferred: number;
        }) => {
          dispatch(onProgress(percentage, transferred));
        },
        250
      );

      exporter.on('progress', function (transferred) {
        let percent = 0;
        if (numDocsToExport !== null && numDocsToExport > 0) {
          percent = (transferred * 100) / numDocsToExport;
        }
        numDocsActuallyExported = transferred;

        throttledProgress({
          percentage: percent,
          transferred,
        });
      });

      dispatch(onStarted(exporter, dest, numDocsToExport));
      await exporter.start();
      log.info(mongoLogId(1001000086), 'Export', 'Finished export', {
        ns,
        numDocsToExport,
        fileName: exportData.fileName,
      });
      dispatch(onFinished(numDocsActuallyExported));
      /**
       * TODO: lucas: For metrics:
       *
       * "resource": "Export",
       * "action": "completed",
       * "file_type": "<csv|json_array>",
       * "num_docs": "<how many docs exported>",
       * "full_collection": true|false
       * "filter": true|false,
       * "projection": true|false,
       * "skip": true|false,
       * "limit": true|false,
       * "fields_selected": true|false
       */
      dispatch(
        globalAppRegistryEmit(
          'export-finished',
          numDocsToExport,
          exportData.fileType
        )
      );
    } catch (err: unknown) {
      log.error(mongoLogId(1001000085), 'Export', 'Export failed', {
        ns,
        error: (err as Error)?.message,
      });
      exportSucceded = false;
      debug('error running export pipeline', err);
      return dispatch(onError(err as Error));
    } finally {
      track('Export Completed', {
        type: exportData.aggregation ? 'aggregation' : 'query',
        all_docs: exportData.isFullCollection,
        file_type: exportData.fileType,
        all_fields: Object.values(exportData.fields).every(
          (checked) => checked
        ),
        number_of_docs: numDocsToExport,
        success: exportSucceded,
      });
    }
  };

const getExportSource = (
  dataService: DataService,
  ns: string,
  exportData: State
) => {
  if (exportData.aggregation) {
    const { stages, options } = exportData.aggregation;
    options.maxTimeMS = capMaxTimeMSAtPreferenceLimit(options.maxTimeMS);
    return {
      columns: true,
      source: dataService.aggregateCursor(ns, stages, options),
      numDocsToExport: exportData.count,
    };
  }
  return getQueryExportSource(
    dataService,
    ns,
    exportData.query,
    exportData.fields,
    exportData.count,
    exportData.isFullCollection
  );
};

const getQueryExportSource = async (
  dataService: DataService,
  ns: string,
  query: ExportQueryType | null,
  fields: ExportFieldsType,
  count: number | null,
  isFullCollection: boolean
) => {
  const spec = getQuery(query, isFullCollection);
  const numDocsToExport = isFullCollection
    ? await fetchDocumentCount(dataService, ns, spec)
    : count;
  // filter out only the fields we want to include in our export data
  const projection = Object.fromEntries(
    Object.entries(fields).filter((keyAndValue) => keyAndValue[1])
  );
  if (
    Object.keys(projection).length > 0 &&
    (undefined === fields._id || !fields._id)
  ) {
    projection._id = false;
  }
  log.info(mongoLogId(1001000083), 'Export', 'Start reading from collection', {
    ns,
    numDocsToExport,
    spec,
    projection,
  });
  const source = dataService.findCursor(ns, spec.filter || {}, {
    projection,
    limit: spec.limit,
    skip: spec.skip,
  });
  // Pick the columns that are going to be matched by the projection,
  // where some prefix the field (e.g. ['a', 'a.b', 'a.b.c'] for 'a.b.c')
  // has an entry in the projection object.
  const columns = Object.keys(fields).filter((field) =>
    field
      .split('.')
      .some(
        (_part, index, parts) => projection[parts.slice(0, index + 1).join('.')]
      )
  );

  return {
    columns,
    source,
    numDocsToExport,
  };
};

/**
 * Cancel the currently running export operation, if any.
 * @api public
 */
export const cancelExport =
  () => (dispatch: Dispatch, getState: () => RootExportState) => {
    const { exportData } = getState();
    const { exporter, dest } = exportData;

    if (!exporter || !dest) {
      debug('no active streams to cancel.');
      return;
    }
    log.info(
      mongoLogId(1001000088),
      'Export',
      'Cancelling export by user request'
    );
    exporter.cancel();

    dispatch({ type: CANCELED });
  };

export default reducer;
