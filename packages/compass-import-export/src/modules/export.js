/* eslint-disable valid-jsdoc */
import fs from 'fs';
import stream from 'stream';

import PROCESS_STATUS from 'constants/process-status';
import EXPORT_STEP from 'constants/export-step';
import FILE_TYPES from 'constants/file-types';
import { appRegistryEmit, globalAppRegistryEmit } from 'modules/compass';

import { createReadableCollectionStream } from 'utils/collection-stream';

const createProgressStream = require('progress-stream');

import { createLogger } from 'utils/logger';
import { createCSVFormatter, createJSONFormatter } from 'utils/formatters';

const debug = createLogger('export');

const PREFIX = 'import-export/export';

const STARTED = `${PREFIX}/STARTED`;
const CANCELED = `${PREFIX}/CANCELED`;

const PROGRESS = `${PREFIX}/PROGRESS`;
const FINISHED = `${PREFIX}/FINISHED`;
const ERROR = `${PREFIX}/ERROR`;

const SELECT_FILE_TYPE = `${PREFIX}/SELECT_FILE_TYPE`;
const SELECT_FILE_NAME = `${PREFIX}/SELECT_FILE_NAME`;

const ON_MODAL_OPEN = `${PREFIX}/ON_MODAL_OPEN`;
const CLOSE = `${PREFIX}/CLOSE`;

const CHANGE_EXPORT_STEP = `${PREFIX}/CHANGE_EXPORT_STEP`;

const UPDATE_FIELDS = `${PREFIX}/UPDATE_FIELDS`;

const QUERY_CHANGED = `${PREFIX}/QUERY_CHANGED`;
const TOGGLE_FULL_COLLECTION = `${PREFIX}/TOGGLE_FULL_COLLECTION`;

/**
 * A full collection query.
 */
const FULL_QUERY = {
  filter: {}
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
  fileName: '',
  fileType: FILE_TYPES.JSON,
  status: PROCESS_STATUS.UNSPECIFIED,
  exportedDocsCount: 0,
  count: 0
};

/**
 * @param {stream.Readable} source
 * @param {stream.Writable} dest
 * @api private
 */
export const onStarted = (source, dest, count) => ({
  type: STARTED,
  source: source,
  dest: dest,
  count: count
});

/**
 * @param {Object} progress
 * @api private
 */
export const onProgress = (progress, exportedDocsCount) => ({
  type: PROGRESS,
  progress: progress,
  exportedDocsCount: exportedDocsCount
});

/**
 * @api private
 */
export const onFinished = exportedDocsCount => ({
  type: FINISHED,
  exportedDocsCount: exportedDocsCount
});

/**
 * The error callback.
 * @param {Error} error
 * @api private
 */
export const onError = error => ({
  type: ERROR,
  error: error
});

// TODO: Refactor this so import and export reuse as much
// base logic as possible.
// eslint-disable-next-line complexity
const reducer = (state = INITIAL_STATE, action) => {
  if (action.type === TOGGLE_FULL_COLLECTION) {
    return {
      ...state,
      isFullCollection: !state.isFullCollection
    };
  }

  if (action.type === QUERY_CHANGED) {
    return {
      ...state,
      query: action.query
    };
  }

  if (action.type === ON_MODAL_OPEN) {
    return {
      ...INITIAL_STATE,
      count: action.count,
      query: action.query,
      isOpen: true
    };
  }

  if (action.type === CLOSE) {
    return {
      ...state,
      isOpen: false
    };
  }

  if (action.type === STARTED) {
    return {
      ...state,
      error: null,
      progress: 0,
      status: PROCESS_STATUS.STARTED,
      source: action.source,
      dest: action.dest,
      count: action.count
    };
  }

  if (action.type === PROGRESS) {
    return {
      ...state,
      progress: action.progress,
      exportedDocsCount: action.exportedDocsCount
    };
  }

  if (action.type === FINISHED) {
    const isComplete = !(
      state.error || state.status === PROCESS_STATUS.CANCELED
    );
    return {
      ...state,
      // isOpen: !isComplete,
      status: isComplete ? PROCESS_STATUS.COMPLETED : state.status,
      exportedDocsCount: action.exportedDocsCount,
      source: undefined,
      dest: undefined
    };
  }

  if (action.type === CANCELED) {
    return {
      ...state,
      status: PROCESS_STATUS.CANCELED,
      source: undefined,
      dest: undefined
    };
  }

  if (action.type === UPDATE_FIELDS) {
    return {
      ...state,
      fields: action.fields
    };
  }

  if (action.type === SELECT_FILE_NAME) {
    return {
      ...state,
      fileName: action.fileName,
      status: PROCESS_STATUS.UNSPECIFIED,
      exportedDocsCount: 0,
      source: undefined,
      dest: undefined
    };
  }

  if (action.type === SELECT_FILE_TYPE) {
    return {
      ...state,
      fileType: action.fileType
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
      status: PROCESS_STATUS.FAILED
    };
  }

  return state;
};

/**
 * Toggle the full collection flag.
 * @api public
 */
export const toggleFullCollection = () => ({
  type: TOGGLE_FULL_COLLECTION
});

/**
 * Select the file type of the export.
 * @api public
 * @param {String} fileType
 */
export const selectExportFileType = fileType => ({
  type: SELECT_FILE_TYPE,
  fileType: fileType
});

/**
 * Select the file name to export to
 * @api public
 * @param {String} fileName
 */
export const selectExportFileName = fileName => ({
  type: SELECT_FILE_NAME,
  fileName: fileName
});

/**
 * Change the query.
 * @api public
 * @param {Object} query
 */
export const queryChanged = query => ({
  type: QUERY_CHANGED,
  query: query
});


/**
 * Populate export modal data on open.
 * @api private
 * @param {Number} document count given current query.
 * @param {Object} current query.
 */
export const onModalOpen = (count, query) => ({
  type: ON_MODAL_OPEN,
  count: count, query: query
});

/**
 * Close the export modal.
 * @api public
 */
export const closeExport = () => ({
  type: CLOSE
});

/**
 * Update export fields
 * @api public
 * @param {Object} fields: currently selected/disselected fields to be exported
 */
export const updateFields = (fields) => ({
  type: UPDATE_FIELDS,
  fields: fields
});

/**
 * Select fields to be exported
 * @api public
 * @param {String} status: next step in export
 */
export const changeExportStep = (status) => ({
  type: CHANGE_EXPORT_STEP,
  status: status
});

/**
 * Open the export modal.
 *
 * Counts the documents to be exported given the current query on modal open to
 * provide user with accurate export data
 *
 * @api public
 */
export const openExport = () => {
  return (dispatch, getState) => {
    const {
      ns,
      exportData,
      dataService: { dataService }
    } = getState();

    const spec = exportData.query;

    dataService.estimatedCount(ns, {query: spec.filter}, function(countErr, count) {
      if (countErr) {
        return onError(countErr);
      }
      dispatch(onModalOpen(count, spec));
    });
  };
};

export const sampleFields = () => {
  return (dispatch, getState) => {
    const {
      ns,
      exportData,
      dataService: { dataService }
    } = getState();

    const spec = exportData.isFullCollection
      ? { filter: {} }
      : exportData.query;

    dataService.find(ns, spec.filter, {limit: 1}, function(findErr, docs) {
      if (findErr) {
        return onError(findErr);
      }

      const fields = Object.keys(docs[0]).sort().reduce((obj, field) => {
        obj[field] = 1;

        return obj;
      }, {});

      dispatch(updateFields(fields));
    });
  };
};

/**
 * Run the actual export to file.
 * @api public
 */
export const startExport = () => {
  return (dispatch, getState) => {
    const {
      ns,
      exportData,
      dataService: { dataService }
    } = getState();

    const spec = exportData.isFullCollection
      ? { filter: {} }
      : exportData.query;

    // filter out only the fields we want to include in our export data
    const projection = Object.keys(exportData.fields)
      .filter(field => exportData.fields[field] === 1)
      .reduce((obj, field) => {
        obj[field] = exportData.fields[field];

        return obj;
      }, {});

    dataService.estimatedCount(ns, {query: spec.filter}, function(countErr, numDocsToExport) {
      if (countErr) {
        return onError(countErr);
      }

      debug('count says to expect %d docs in export', numDocsToExport);

      const source = createReadableCollectionStream(dataService, ns, spec, projection);

      const progress = createProgressStream({
        objectMode: true,
        length: numDocsToExport,
        time: 250 /* ms */
      });

      progress.on('progress', function(info) {
        dispatch(onProgress(info.percentage, info.transferred));
      });

      let formatter;
      if (exportData.fileType === 'csv') {
        formatter = createCSVFormatter();
      } else {
        formatter = createJSONFormatter();
      }

      const dest = fs.createWriteStream(exportData.fileName);

      debug('executing pipeline');
      dispatch(onStarted(source, dest, numDocsToExport));
      stream.pipeline(source, progress, formatter, dest, function(err) {
        if (err) {
          debug('error running export pipeline', err);
          return dispatch(onError(err));
        }
        debug(
          'done. %d docs exported to %s',
          numDocsToExport,
          exportData.fileName
        );
        dispatch(onFinished(numDocsToExport));
        dispatch(
          appRegistryEmit(
            'export-finished',
            numDocsToExport,
            exportData.fileType
          )
        );

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
      });
    });
  };
};

/**
 * Cancel the currently running export operation, if any.
 * @api public
 */
export const cancelExport = () => {
  return (dispatch, getState) => {
    const { exportData } = getState();
    const { source, dest } = exportData;

    if (!source || !dest) {
      debug('no active streams to cancel.');
      return;
    }
    debug('cancelling');
    source.unpipe();

    debug('canceled by user');
    dispatch({ type: CANCELED });
  };
};

export default reducer;
