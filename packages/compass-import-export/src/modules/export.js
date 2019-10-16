/* eslint-disable valid-jsdoc */
import fs from 'fs';
import stream from 'stream';

import PROCESS_STATUS from 'constants/process-status';
import FILE_TYPES from 'constants/file-types';
import { appRegistryEmit } from 'modules/compass/app-registry';

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

const OPEN = `${PREFIX}/OPEN`;
const CLOSE = `${PREFIX}/CLOSE`;

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
  isFullCollection: false,
  progress: 0,
  query: FULL_QUERY,
  error: null,
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

  if (action.type === OPEN) {
    return {
      ...INITIAL_STATE,
      query: state.query,
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
 * Open the export modal.
 * @api public
 */
export const openExport = () => ({
  type: OPEN
});

/**
 * Close the export modal.
 * @api public
 */
export const closeExport = () => ({
  type: CLOSE
});

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

    dataService.estimatedCount(ns, {query: spec.filter}, function(countErr, numDocsToExport) {
      if (countErr) {
        return onError(countErr);
      }

      debug('count says to expect %d docs in export', numDocsToExport);

      const source = createReadableCollectionStream(dataService, ns, spec);

      const progress = createProgressStream({
        objectMode: true,
        length: numDocsToExport,
        time: 250 /* ms */
      });

      progress.on('progress', function(info) {
        // debug('progress', info);
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

      // TODO: lucas: figure out how to make onStarted();
      dispatch(onStarted(source, dest, numDocsToExport));
      stream.pipeline(source, progress, formatter, dest, function(err, res) {
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
    // dest.end();
    debug('canceled by user');
    dispatch({ type: CANCELED });
  };
};

export default reducer;
