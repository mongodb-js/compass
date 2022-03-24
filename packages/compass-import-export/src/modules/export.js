/* eslint-disable valid-jsdoc */
import fs from 'fs';
import { promisify } from 'util';

import PROCESS_STATUS from '../constants/process-status';
import EXPORT_STEP from '../constants/export-step';
import FILE_TYPES from '../constants/file-types';
import { globalAppRegistryEmit, nsChanged } from './compass';

const createProgressStream = require('progress-stream');

import createLoggerAndTelemetry from '@mongodb-js/compass-logging';
import { loadFields, getSelectableFields } from './load-fields';
import { CursorExporter } from './cursor-exporter';
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

/**
 * A full collection query.
 */
const FULL_QUERY = {
  filter: {},
};

/**
 * The initial state.
 * @api private
 */
export const INITIAL_STATE = {
  isOpen: false,
  exportStep: EXPORT_STEP.QUERY,
  isFullCollection: false,
  progress: 0,
  query: FULL_QUERY,
  error: null,
  fields: {},
  allFields: {},
  fileName: '',
  fileType: FILE_TYPES.JSON,
  status: PROCESS_STATUS.UNSPECIFIED,
  exportedDocsCount: 0,
  count: 0,
};

/**
 * @param {stream.Readable} source
 * @param {stream.Writable} dest
 * @api private
 */
export const onStarted = (exporter, dest, count) => ({
  type: STARTED,
  exporter: exporter,
  dest: dest,
  count: count,
});

/**
 * @param {Object} progress
 * @api private
 */
export const onProgress = (progress, exportedDocsCount) => ({
  type: PROGRESS,
  progress: progress,
  exportedDocsCount: exportedDocsCount,
});

/**
 * @api private
 */
export const onFinished = (exportedDocsCount) => ({
  type: FINISHED,
  exportedDocsCount: exportedDocsCount,
});

/**
 * The error callback.
 * @param {Error} error
 * @api private
 */
export const onError = (error) => ({
  type: ERROR,
  error: error,
});

export const reset = () => {
  return { type: RESET };
};

// eslint-disable-next-line complexity
const reducer = (state = INITIAL_STATE, action) => {
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
    return {
      ...INITIAL_STATE,
      count: action.count,
      query: action.query,
      isOpen: true,
    };
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
      source: undefined,
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
 * @api public
 * @param {String} fileType
 */
export const selectExportFileType = (fileType) => ({
  type: SELECT_FILE_TYPE,
  fileType: fileType,
});

/**
 * Select the file name to export to
 * @api public
 * @param {String} fileName
 */
export const selectExportFileName = (fileName) => ({
  type: SELECT_FILE_NAME,
  fileName: fileName,
});

/**
 * Change the query.
 * @api public
 * @param {Object} query
 */
export const queryChanged = (query) => ({
  type: QUERY_CHANGED,
  query: query,
});

/**
 * Populate export modal data on open.
 * @api private
 * @param {Number} document count given current query.
 * @param {Object} current query.
 */
export const onModalOpen = ({ namespace, count, query }) => ({
  type: ON_MODAL_OPEN,
  namespace,
  count,
  query,
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
export const updateSelectedFields = (fields) => ({
  type: UPDATE_SELECTED_FIELDS,
  fields: fields,
});

/**
 * Update export fields (list of full field names)
 * @api public
 * @param {Object} fields: currently selected/disselected fields to be exported
 */
export const updateAllFields = (fields) => ({
  type: UPDATE_ALL_FIELDS,
  fields: fields,
});

/**
 * Select fields to be exported
 * @api public
 * @param {String} status: next step in export
 */
export const changeExportStep = (status) => ({
  type: CHANGE_EXPORT_STEP,
  status: status,
});

const fetchDocumentCount = async (dataService, ns, query) => {
  // When there is no filter/limit/skip try to use the estimated count.
  if (
    (!query.filter || Object.keys(query.filter).length < 1) &&
    !query.limit &&
    !query.skip
  ) {
    try {
      const runEstimatedDocumentCount = promisify(
        dataService.estimatedCount.bind(dataService)
      );
      const count = await runEstimatedDocumentCount(ns, {});
      return count;
    } catch (estimatedCountErr) {
      // `estimatedDocumentCount` is currently unsupported for
      // views and time-series collections, so we can fallback to a full
      // count in these cases and ignore this error.
    }
  }

  const runCount = promisify(dataService.count.bind(dataService));

  const count = await runCount(ns, query.filter || {}, {
    ...(query.limit ? { limit: query.limit } : {}),
    ...(query.skip ? { skip: query.skip } : {}),
  });
  return count;
};

/**
 * Open the export modal.
 *
 * @param {number} [count] - optional pre supplied count to shortcut and
 * avoid a possibly expensive re-count.
 *
 * Counts the documents to be exported given the current query on modal open to
 * provide user with accurate export data
 *
 * @api public
 */
export const openExport = ({ namespace, query, count: maybeCount }) => {
  return async (dispatch, getState) => {
    track('Export Opened');
    const {
      dataService: { dataService },
    } = getState();

    try {
      const count =
        maybeCount ?? (await fetchDocumentCount(dataService, namespace, query));

      dispatch(nsChanged(namespace));
      dispatch(onModalOpen({ namespace, query, count }));
    } catch (e) {
      dispatch(onError(e));
    }
  };
};

export const sampleFields = () => {
  return async (dispatch, getState) => {
    const {
      ns,
      exportData,
      dataService: { dataService },
    } = getState();

    const spec = exportData.isFullCollection
      ? { filter: {} }
      : exportData.query;

    try {
      const allFields = await loadFields(dataService, ns, {
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
};

/**
 * Run the actual export to file.
 * @api public
 */
export const startExport = () => {
  return async (dispatch, getState) => {
    const {
      ns,
      exportData,
      dataService: { dataService },
    } = getState();

    let exportSucceded = true;

    const spec = exportData.isFullCollection
      ? { filter: {} }
      : exportData.query;
    const numDocsToExport = exportData.isFullCollection
      ? await fetchDocumentCount(dataService, ns, spec)
      : exportData.count;
    // filter out only the fields we want to include in our export data
    const projection = Object.fromEntries(
      Object.entries(exportData.fields).filter(
        (keyAndValue) => keyAndValue[1] === 1
      )
    );
    if (
      Object.keys(projection).length > 0 &&
      (undefined === exportData.fields._id || exportData.fields._id === 0)
    ) {
      projection._id = 0;
    }
    log.info(
      mongoLogId(1001000083),
      'Export',
      'Start reading from collection',
      {
        ns,
        numDocsToExport,
        spec,
        projection,
      }
    );
    // const source = createReadableCollectionStream(
    //   dataService,
    //   ns,
    //   spec,
    //   projection
    // );
    const progress = createProgressStream({
      objectMode: true,
      length: numDocsToExport,
      time: 250 /* ms */,
    });

    progress.on('progress', function (info) {
      dispatch(onProgress(info.percentage, info.transferred));
    });

    log.info(mongoLogId(1001000084), 'Export', 'Start writing to file', {
      ns,
      fileType: exportData.fileType,
      fileName: exportData.fileName,
      fields: Object.keys(exportData.allFields),
    });
    // Pick the columns that are going to be matched by the projection,
    // where some prefix the field (e.g. ['a', 'a.b', 'a.b.c'] for 'a.b.c')
    // has an entry in the projection object.
    const columns = Object.keys(exportData.fields).filter((field) =>
      field
        .split('.')
        .some(
          (_part, index, parts) =>
            projection[parts.slice(0, index + 1).join('.')]
        )
    );
    try {
      const dest = fs.createWriteStream(exportData.fileName);
      debug('executing pipeline');
      const source = dataService.fetch(ns, spec.filter || {}, {
        projection,
        limit: spec.limit,
        skip: spec.skip,
      });
      const exporter = new CursorExporter({
        cursor: source,
        type: exportData.fileType,
        columns: columns,
        output: dest,
        totalNumberOfDocuments: numDocsToExport,
      });

      exporter.on('progress', function (transferred) {
        let percent = 0;
        if (numDocsToExport > 0) {
          percent = (transferred * 100) / this.numDocsToExport;
        }
        progress.emit('progress', {
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
      dispatch(onFinished(numDocsToExport));
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
    } catch (err) {
      log.error(mongoLogId(1001000085), 'Export', 'Export failed', {
        ns,
        error: err.message,
      });
      exportSucceded = false;
      debug('error running export pipeline', err);
      return dispatch(onError(err));
    } finally {
      track('Export Completed', {
        all_docs: exportData.isFullCollection,
        file_type: exportData.fileType,
        all_fields: Object.values(exportData.fields).every(
          (checked) => checked === 1
        ),
        number_of_docs: numDocsToExport,
        success: exportSucceded,
      });
    }
  };
};

/**
 * Cancel the currently running export operation, if any.
 * @api public
 */
export const cancelExport = () => {
  return (dispatch, getState) => {
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
};

export default reducer;
