import fs from 'fs';
import PROCESS_STATUS from 'constants/process-status';
import { appRegistryEmit } from 'modules/compass';
import stream from 'stream';

import createProgressStream from 'progress-stream';
import stripBomStream from 'strip-bom-stream';

import detectImportFile from 'utils/detect-import-file';
import mime from 'mime-types';

import { createLogger } from 'utils/logger';
import { createCollectionWriteStream } from 'utils/collection-stream';
import { createCSVParser, createJSONParser } from 'utils/parsers';

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

/**
 * Initial state.
 * @api private
 */
export const INITIAL_STATE = {
  isOpen: false,
  progress: 0,
  error: null,
  fileName: '',
  fileType: undefined,
  fileIsMultilineJSON: false,
  fileDelimiter: undefined,
  ignoreEmpty: true,
  useHeaderLines: true,
  status: PROCESS_STATUS.UNSPECIFIED,
  fileStats: null,
  docsWritten: 0
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
      fileStats: { size }
    } = importData;

    const source = fs.createReadStream(fileName, 'utf8');
    const dest = createCollectionWriteStream(dataService, ns);

    // TODO: lucas: Use bson.calculateObjectSize per doc for better progress?
    const progress = createProgressStream({
      objectMode: true,
      length: size,
      time: 250 /* ms */
    });

    progress.on('progress', function(info) {
      debug('progress', info);
      dispatch(onProgress(info.percentage, dest.docsWritten));
    });

    let parser;
    if (fileType === 'csv') {
      parser = createCSVParser();
    } else {
      parser = createJSONParser({
        selector: fileIsMultilineJSON ? null : '*',
        fileName: fileName
      });
    }

    debug('executing pipeline');

    dispatch(onStarted(source, dest));
    stream.pipeline(source, stripBomStream(), progress, parser, dest, function(
      err,
      res
    ) {
      if (err) {
        return dispatch(onError(err));
      }
      debug('done', err, res);
      dispatch(onFinished(dest.docsWritten));
      dispatch(appRegistryEmit('import-finished', size, fileType));
    });
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
 * @param {String} fileName
 * @api public
 */
export const selectImportFileName = fileName => {
  return dispatch => {
    fs.exists(fileName, function(exists) {
      if (!exists) {
        return dispatch(onError(new Error(`File ${fileName} not found`)));
      }
      fs.stat(fileName, function(err, stats) {
        if (err) {
          return dispatch(onError(err));
        }

        stats.type = mime.lookup(fileName);

        detectImportFile(fileName, function(detectionError, res) {
          if (detectionError) {
            return dispatch(onError(detectionError));
          }
          dispatch({
            type: FILE_SELECTED,
            fileName: fileName,
            fileStats: stats,
            fileIsMultilineJSON: res.fileIsMultilineJSON,
            fileType: res.fileType
          });
        });
      });
    });
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

export default reducer;
