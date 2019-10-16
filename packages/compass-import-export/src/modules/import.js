import { promisify } from 'util';
import fs from 'fs';
const checkFileExists = promisify(fs.exists);
const getFileStats = promisify(fs.stat);

import stream from 'stream';
import createProgressStream from 'progress-stream';
import stripBomStream from 'strip-bom-stream';
const sizeof = require('object-sizeof');
import mime from 'mime-types';

import PROCESS_STATUS from 'constants/process-status';
import { appRegistryEmit } from 'modules/compass';

import detectImportFile from 'utils/detect-import-file';
import { createCollectionWriteStream } from 'utils/collection-stream';
import { createCSVParser, createJSONParser } from 'utils/parsers';
import removeEmptyFields from 'utils/remove-empty-fields';
import { createLogger } from 'utils/logger';

const debug = createLogger('import');

/**
 * ## Action names
 */
const PREFIX = 'import-export/import';
const STARTED = `${PREFIX}/STARTED`;
const CANCELED = `${PREFIX}/CANCELED`;
const PROGRESS = `${PREFIX}/PROGRESS`;
const FINISHED = `${PREFIX}/FINISHED`;
const FAILED = `${PREFIX}/FAILED`;
const FILE_TYPE_SELECTED = `${PREFIX}/FILE_TYPE_SELECTED`;
const FILE_SELECTED = `${PREFIX}/FILE_SELECTED`;
const OPEN = `${PREFIX}/OPEN`;
const CLOSE = `${PREFIX}/CLOSE`;
const SET_DELIMITER = `${PREFIX}/SET_DELIMITER`;
const SET_STOP_ON_ERRORS = `${PREFIX}/SET_STOP_ON_ERRORS`;
const SET_IGNORE_EMPTY_FIELDS = `${PREFIX}/SET_IGNORE_EMPTY_FIELDS`;

/**
 * Initial state.
 * @api private
 */
export const INITIAL_STATE = {
  isOpen: false,
  progress: 0,
  error: null,
  fileName: '',
  fileIsMultilineJSON: false,
  fileDelimiter: undefined,
  useHeaderLines: true,
  status: PROCESS_STATUS.UNSPECIFIED,
  fileStats: null,
  docsWritten: 0,
  delimiter: undefined,
  stopOnErrors: false,
  ignoreEmptyFields: true
};

/**
 * @param {Object} progress
 * @param {Number} docsWritten
 * @api private
 */
export const onProgress = (progress, docsWritten) => ({
  type: PROGRESS,
  progress: progress,
  error: null,
  docsWritten: docsWritten
});

/**
 * @param {stream.Readable} source
 * @param {stream.Readable} dest
 * @api private
 */
export const onStarted = (source, dest) => ({
  type: STARTED,
  source: source,
  dest: dest
});

/**
 * @param {Number} docsWritten
 * @api private
 */
export const onFinished = docsWritten => ({
  type: FINISHED,
  docsWritten: docsWritten
});

/**
 * @param {Error} error
 * @api private
 */
export const onError = error => ({
  type: FAILED,
  error: error
});

/**
 * The import module reducer.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The state.
 */
// eslint-disable-next-line complexity
const reducer = (state = INITIAL_STATE, action) => {
  if (action.type === SET_DELIMITER) {
    return {
      ...state,
      delimiter: action.delimiter
    };
  }

  if (action.type === SET_STOP_ON_ERRORS) {
    return {
      ...state,
      stopOnErrors: action.stopOnErrors
    };
  }

  if (action.type === SET_IGNORE_EMPTY_FIELDS) {
    return {
      ...state,
      ignoreEmptyFields: action.ignoreEmptyFields
    };
  }

  if (action.type === FILE_SELECTED) {
    return {
      ...state,
      fileName: action.fileName,
      fileType: action.fileType,
      fileStats: action.fileStats,
      fileIsMultilineJSON: action.fileIsMultilineJSON,
      status: PROCESS_STATUS.UNSPECIFIED,
      progress: 0,
      docsWritten: 0,
      source: undefined,
      dest: undefined
    };
  }

  if (action.type === FAILED) {
    return {
      ...state,
      error: action.error,
      status: PROCESS_STATUS.FAILED
    };
  }

  if (action.type === STARTED) {
    return {
      ...state,
      error: null,
      progress: 0,
      status: PROCESS_STATUS.STARTED,
      source: action.source,
      dest: action.dest
    };
  }

  if (action.type === PROGRESS) {
    return {
      ...state,
      progress: action.progress,
      docsWritten: action.docsWritten
    };
  }

  if (action.type === FINISHED) {
    const isComplete = !(
      state.error || state.status === PROCESS_STATUS.CANCELED
    );
    return {
      ...state,
      status: isComplete ? PROCESS_STATUS.COMPLETED : state.status,
      docsWritten: action.docsWritten,
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

  /**
   * Open the `<ImportModal />`
   */
  if (action.type === OPEN) {
    return {
      ...INITIAL_STATE,
      isOpen: true
    };
  }

  if (action.type === CLOSE) {
    return {
      ...state,
      isOpen: false
    };
  }

  if (action.type === FILE_TYPE_SELECTED) {
    return {
      ...state,
      fileType: action.fileType
    };
  }
  return state;
};

/**
 * @api public
 */
export const startImport = () => {
  return (dispatch, getState) => {
    const state = getState();
    const {
      ns,
      dataService: { dataService },
      importData
    } = state;
    const {
      fileName,
      fileType,
      fileIsMultilineJSON,
      fileStats: { size },
      delimiter,
      ignoreEmptyFields,
      stopOnErrors
    } = importData;

    const source = fs.createReadStream(fileName, 'utf8');

    // TODO: lucas: Support ignoreUndefined as an option to pass to driver?
    const dest = createCollectionWriteStream(dataService, ns, stopOnErrors);

    const progress = createProgressStream({
      objectMode: true,
      length: size / 800,
      time: 500 /* ms */
    });

    // TODO: this kinda works now :) could be way better
    // with a continuously updated reservoir sample...
    // BUT good enough for now.
    const sizer = new stream.Transform({
      objectMode: true,
      transform: function(chunk, encoding, cb) {
        if (!this.sizes) {
          this.sizes = [];
          this._done = false;
          this._keyCount = Object.keys(chunk);
        }

        if (this._done === true) {
          return cb(null, chunk);
        }
        this.sizes.push(sizeof(chunk) + 1);

        if (this.sizes.length === 100) {
          this._done = true;
          const sum = this.sizes.reduce(function(accumulator, currentValue) {
            return accumulator + currentValue;
          }, 0);

          const avg = sum / this.sizes.length;
          const estDocs = Math.floor((size / avg) * 4);
          progress.setLength(estDocs);

          console.group('Object Size estimator');
          console.log('avg', avg);
          console.log('file size', size);
          console.log('est docs', estDocs);
          console.log('keyCount', this._keyCount);
          console.log('sizes', this.sizes);

          console.groupEnd();
        }
        return cb(null, chunk);
      }
    });

    const removeEmptyFieldsStream = new stream.Transform({
      objectMode: true,
      transform: function(chunk, encoding, cb) {
        if (!ignoreEmptyFields) {
          return cb(null, chunk);
        }
        cb(null, removeEmptyFields(chunk));
      }
    });

    const throttle = require('lodash.throttle');
    function update_import_progress_throttled(info) {
      // debug('progress', info);
      dispatch(onProgress(info.percentage, dest.docsWritten));
    }
    const updateProgress = throttle(update_import_progress_throttled, 500);
    progress.on('progress', updateProgress);

    let parser;
    if (fileType === 'csv') {
      parser = createCSVParser({
        delimiter: delimiter
      });
    } else {
      parser = createJSONParser({
        selector: fileIsMultilineJSON ? null : '*',
        fileName: fileName
      });
    }

    debug('executing pipeline');

    dispatch(onStarted(source, dest));
    stream.pipeline(
      source,
      stripBomStream(),
      parser,
      sizer,
      progress,
      removeEmptyFieldsStream,
      dest,
      function(err, res) {
        if (err) {
          return dispatch(onError(err));
        }
        debug('done', err, res);
        dispatch(onFinished(dest.docsWritten));
        dispatch(appRegistryEmit('import-finished', size, fileType));
      }
    );
  };
};

/**
 * @api public
 */
export const cancelImport = () => {
  return (dispatch, getState) => {
    const { importData } = getState();
    const { source, dest } = importData;

    if (!source || !dest) {
      debug('no active import to cancel.');
      return;
    }
    debug('cancelling');
    source.unpipe();
    dest.end();
    debug('import canceled by user');
    dispatch({ type: CANCELED });
  };
};

/**
 * Gather file metadata quickly when the user specifies `fileName`.
 * @param {String} fileName
 * @api public
 */
export const selectImportFileName = fileName => {
  return dispatch => {
    let fileStats = {};
    checkFileExists(fileName)
      .then(exists => {
        if (!exists) {
          throw new Error(`File ${fileName} not found`);
        }
        return getFileStats(fileName);
      })
      .then(stats => {
        fileStats = {
          ...stats,
          type: mime.lookup(fileName)
        };
        return promisify(detectImportFile)(fileName);
      })
      .then(detected => {
        dispatch({
          type: FILE_SELECTED,
          fileName: fileName,
          fileStats: fileStats,
          fileIsMultilineJSON: detected.fileIsMultilineJSON,
          fileType: detected.fileType
        });
      })
      .catch(err => dispatch(onError(err)));
  };
};

/**
 * Select the file type of the import.
 *
 * @param {String} fileType
 * @api public
 */
export const selectImportFileType = fileType => ({
  type: FILE_TYPE_SELECTED,
  fileType: fileType
});

/**
 * Open the import modal.
 * @api public
 */
export const openImport = () => ({
  type: OPEN
});

/**
 * Close the import modal.
 * @api public
 */
export const closeImport = () => ({
  type: CLOSE
});

/**
 * Set the tabular delimiter.
 *
 * @api public
 */
export const setDelimiter = delimiter => ({
  type: SET_DELIMITER,
  delimiter: delimiter
});

/**
 * @api public
 */
export const setStopOnErrors = stopOnErrors => ({
  type: SET_STOP_ON_ERRORS,
  stopOnErrors: stopOnErrors
});

/**
 * @api public
 */
export const setIgnoreEmptyFields = setignoreEmptyFields => ({
  type: SET_IGNORE_EMPTY_FIELDS,
  setignoreEmptyFields: setignoreEmptyFields
});

export default reducer;
