import fs from 'fs';
import { Observable } from 'rxjs/Observable';
import streamToObservable from 'stream-to-observable';

import exportCollection from 'utils/export';

import PROCESS_STATUS from 'constants/process-status';
import FILE_TYPES from 'constants/file-types';

/**
 * Export action prefix.
 */
const PREFIX = 'import-export/export';

/**
 * Export action name.
 */
const EXPORT_ACTION = `${PREFIX}/EXPORT_ACTION`;

/**
 * Export progress action name.
 */
const EXPORT_PROGRESS = `${PREFIX}/EXPORT_PROGRESS`;

/**
 * Export completed action name.
 */
const EXPORT_COMPLETED = `${PREFIX}/EXPORT_COMPLETED`;

/**
 * Export canceled action name.
 */
const EXPORT_CANCELED = `${PREFIX}/EXPORT_CANCELED`;

/**
 * Export failed action name.
 */
const EXPORT_FAILED = `${PREFIX}/EXPORT_FAILED`;
const SELECT_EXPORT_FILE_TYPE = `${PREFIX}/SELECT_EXPORT_FILE_TYPE`;
const SELECT_EXPORT_FILE_NAME = `${PREFIX}/SELECT_EXPORT_FILE_NAME`;
const OPEN_EXPORT = `${PREFIX}/OPEN_EXPORT`;
const CLOSE_EXPORT = `${PREFIX}/CLOSE_EXPORT`;

/**
 * The initial state.
 */
const INITIAL_STATE = {
  isOpen: false,
  progress: 0,
  query: {},
  error: null,
  fileName: '',
  fileType: FILE_TYPES.JSON,
  status: PROCESS_STATUS.UNSPECIFIED
};

let exportStatus = PROCESS_STATUS.UNSPECIFIED;

/**
 * Export action creator.
 *
 * @param {String} status - The status.
 *
 * @returns {Object} The action.
 */
export const exportAction = (status) => ({
  type: EXPORT_ACTION,
  status: status
});

/**
 * Select the file type of the export.
 *
 * @param {String} fileType - The file type.
 *
 * @returns {Object} The action.
 */
export const selectExportFileType = (fileType) => ({
  type: SELECT_EXPORT_FILE_TYPE,
  fileType: fileType
});

/**
 * Select the file name to export to.
 *
 * @param {String} fileName - The file name.
 *
 * @returns {Object} The action.
 */
export const selectExportFileName = (fileName) => ({
  type: SELECT_EXPORT_FILE_NAME,
  fileName: fileName
});

/**
 * Open the export modal.
 *
 * @param {Object} query - The query.
 *
 * @returns {Object} The action.
 */
export const openExport = (query) => ({
  type: OPEN_EXPORT,
  query: query
});

/**
 * Close the export modal.
 *
 * @returns {Object} The action.
 */
export const closeExport = () => ({
  type: CLOSE_EXPORT
});

/**
 * Export progress action creator.
 *
 * @param {Number} progress - The progress.
 *
 * @returns {Object} The action.
 */
const exportProgress = (progress) => ({
  type: EXPORT_PROGRESS,
  progress: progress
});

/**
 * Export finished action creator.
 *
 * @returns {Object} The action.
 */
const exportFinished = () => ({
  type: exportStatus !== PROCESS_STATUS.CANCELLED ? EXPORT_COMPLETED : EXPORT_CANCELED
});

/**
 * Export failed action creator.
 *
 * @param {Error} error - The error.
 *
 * @returns {Object} The action.
 */
const exportFailed = (error) => ({
  type: EXPORT_FAILED,
  error: error
});

/**
 * The export epic.
 *
 * @param {Object} action$ - The action.
 * @param {Store} store - The store.
 *
 * @returns {Epic} The epic.
 */
export const exportStartedEpic = (action$, store) =>
  action$.ofType(EXPORT_ACTION)
    .flatMap(act => {
      exportStatus = act.status;
      if (exportStatus === PROCESS_STATUS.CANCELLED) {
        return Observable.empty();
      }

      const { stats, ns, exportData, dataService } = store.getState();
      const fws = fs.createWriteStream(exportData.fileName);
      const { cursor, docTransform } = exportCollection(dataService, ns, exportData.fileType);

      docTransform.pipe(fws);
      return streamToObservable(docTransform)
        .map(() => exportProgress((fws.bytesWritten * 100) / stats.rawTotalDocumentSize))
        .takeWhile(() => exportStatus !== PROCESS_STATUS.CANCELLED)
        .catch(exportFailed)
        .concat(Observable.of('').map(() => {
          return exportFinished();
        }))
        .finally(() => {
          cursor.close();
          docTransform.end();
          fws.end();
        });
    });

/**
 * The export reducer.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} state - The new state.
 */
const reducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case EXPORT_ACTION:
      return {
        ...state,
        progress: 0,
        status: action.status
      };
    case EXPORT_PROGRESS:
      return {
        ...state,
        progress: Number(action.progress.toFixed(2))
      };
    case EXPORT_COMPLETED:
      return {
        ...state,
        progress: 100,
        status: PROCESS_STATUS.COMPLETED
      };
    case EXPORT_CANCELED:
      return {
        ...state,
        progress: 0,
        status: PROCESS_STATUS.CANCELED
      };
    case EXPORT_FAILED:
      return {
        ...state,
        error: action.error,
        status: PROCESS_STATUS.FAILED
      };
    case SELECT_EXPORT_FILE_TYPE:
      return {
        ...state,
        fileType: action.fileType
      };
    case SELECT_EXPORT_FILE_NAME:
      return {
        ...state,
        fileName: action.fileName
      };
    case OPEN_EXPORT:
      return {
        ...INITIAL_STATE,
        query: action.query,
        isOpen: true
      };
    case CLOSE_EXPORT:
      return {
        ...state,
        isOpen: false
      };
    default:
      return state;
  }
};

export default reducer;
