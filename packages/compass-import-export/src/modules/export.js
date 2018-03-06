import fs from 'fs';
import { Observable } from 'rxjs/Observable';
import streamToObservable from 'stream-to-observable';
import exportCollection from 'utils/export';
import PROCESS_STATUS from 'constants/process-status';
import FILE_TYPES from 'constants/file-types';
import { appRegistryEmit } from 'modules/app-registry';

/**
 * Export action prefix.
 */
const PREFIX = 'import-export/export';

/**
 * Export action name.
 */
export const EXPORT_ACTION = `${PREFIX}/EXPORT_ACTION`;

/**
 * Export progress action name.
 */
export const EXPORT_PROGRESS = `${PREFIX}/EXPORT_PROGRESS`;

/**
 * Export finished action name.
 */
export const EXPORT_FINISHED = `${PREFIX}/EXPORT_FINISHED`;

/**
 * Export failed action name.
 */
export const EXPORT_FAILED = `${PREFIX}/EXPORT_FAILED`;

/**
 * Select export file type action name.
 */
export const SELECT_EXPORT_FILE_TYPE = `${PREFIX}/SELECT_EXPORT_FILE_TYPE`;

/**
 * Select export file name action name.
 */
export const SELECT_EXPORT_FILE_NAME = `${PREFIX}/SELECT_EXPORT_FILE_NAME`;

/**
 * Open export action name.
 */
export const OPEN_EXPORT = `${PREFIX}/OPEN_EXPORT`;

/**
 * Close export action name.
 */
export const CLOSE_EXPORT = `${PREFIX}/CLOSE_EXPORT`;

/**
 * The query changed action name.
 */
export const QUERY_CHANGED = `${PREFIX}/QUERY_CHANGED`;

/**
 * Toggle full collection name.
 */
export const TOGGLE_FULL_COLLECTION = `${PREFIX}/TOGGLE_FULL_COLLECTION`;

/**
 * A full collection query.
 */
const FULL_QUERY = {
  filter: {}
};

/**
 * The initial state.
 */
const INITIAL_STATE = {
  isOpen: false,
  isFullCollection: false,
  progress: 0,
  query: FULL_QUERY,
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
 * Toggle the full collection flag.
 *
 * @returns {Object} The action.
 */
export const toggleFullCollection = () => ({
  type: TOGGLE_FULL_COLLECTION
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
 * Change the query.
 *
 * @param {Object} query - The query.
 *
 * @returns {Object} The action.
 */
export const queryChanged = (query) => ({
  type: QUERY_CHANGED,
  query: query
});

/**
 * Open the export modal.
 *
 * @returns {Object} The action.
 */
export const openExport = () => ({
  type: OPEN_EXPORT
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
export const exportProgress = (progress) => ({
  type: EXPORT_PROGRESS,
  progress: progress
});

/**
 * Export finished action creator.
 *
 * @returns {Object} The action.
 */
export const exportFinished = () => ({
  type: EXPORT_FINISHED
});

/**
 * Export failed action creator.
 *
 * @param {Error} error - The error.
 *
 * @returns {Object} The action.
 */
export const exportFailed = (error) => ({
  type: EXPORT_FAILED,
  error: error
});

/* eslint complexity: 0 */

/**
 * The export epic.
 *
 * @param {Object} action$ - The action.
 * @param {Store} store - The store.
 *
 * @returns {Epic} The epic.
 */
export const exportStartedEpic = (action$, store) =>
  action$.ofType(EXPORT_ACTION).flatMap(act => {
    exportStatus = act.status;
    if (exportStatus === PROCESS_STATUS.CANCELED) {
      return Observable.empty();
    }

    const { stats, ns, exportData, dataService } = store.getState();
    const fws = fs.createWriteStream(exportData.fileName);
    const { cursor, docTransform } = exportCollection(
      dataService,
      ns,
      exportData.isFullCollection ? FULL_QUERY : exportData.query,
      exportData.fileType
    );

    docTransform.pipe(fws);
    return streamToObservable(docTransform)
      .map(() => exportProgress((fws.bytesWritten * 100) / stats.rawTotalDocumentSize))
      .takeWhile(() => exportStatus !== PROCESS_STATUS.CANCELED)
      .catch(exportFailed)
      .concat(Observable.of('').map(() => {
        return exportFinished();
      }))
      .concat(Observable.of('').map(() => {
        return appRegistryEmit('export-finished', stats.rawTotalDocumentSize, exportData.fileType);
      }))
      .finally(() => {
        cursor.close();
        docTransform.end();
        if (exportStatus === PROCESS_STATUS.CANCELED) {
          fws.close();
        } else {
          fws.end();
        }
      });
  });

/**
 * Return the state after the export action.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const doExportAction = (state, action) => ({
  ...state,
  progress: 0,
  status: action.status
});

/**
 * Return the state after the progress action.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const doExportProgress = (state, action) => ({
  ...state,
  progress: Number(action.progress.toFixed(2))
});

/**
 * Return the state after the completed action.
 *
 * @param {Object} state - The state.
 *
 * @returns {Object} The new state.
 */
const doExportFinished = (state) => {
  const isNotComplete = state.error ||
    state.status === PROCESS_STATUS.CANCELED ||
    state.status === PROCESS_STATUS.FAILED;
  return {
    ...state,
    progress: 100,
    isOpen: isNotComplete ? true : false,
    status: (state.status === PROCESS_STATUS.STARTED) ? PROCESS_STATUS.COMPLETED : state.status
  };
};

/**
 * Return the state after the failed action.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const doExportFailed = (state, action) => ({
  ...state,
  error: action.error,
  progress: 100,
  status: PROCESS_STATUS.FAILED
});

/**
 * Return the state after the file type selected action.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const doExportFileTypeSelected = (state, action) => ({
  ...state,
  fileType: action.fileType
});

/**
 * Return the state after the file name selected action.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const doExportFileNameSelected = (state, action) => ({
  ...state,
  fileName: action.fileName
});

/**
 * Return the state after the open action.
 *
 * @param {Object} state - The state.
 *
 * @returns {Object} The new state.
 */
const doOpenExport = (state) => ({
  ...INITIAL_STATE,
  query: state.query,
  isOpen: true
});

/**
 * Return the state after the close action.
 *
 * @param {Object} state - The state.
 *
 * @returns {Object} The new state.
 */
const doCloseExport = (state) => ({
  ...state,
  isOpen: false
});

/**
 * Return the state after the query changed action.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const doQueryChanged = (state, action) => ({
  ...state,
  query: action.query
});

/**
 * Return the state after the toggle full collection action.
 *
 * @param {Object} state - The state.
 *
 * @returns {Object} The new state.
 */
const doToggleFullCollection = (state) => ({
  ...state,
  isFullCollection: !state.isFullCollection
});

/**
 * The reducer function mappings.
 */
const MAPPINGS = {
  [EXPORT_ACTION]: doExportAction,
  [EXPORT_PROGRESS]: doExportProgress,
  [EXPORT_FINISHED]: doExportFinished,
  [EXPORT_FAILED]: doExportFailed,
  [SELECT_EXPORT_FILE_TYPE]: doExportFileTypeSelected,
  [SELECT_EXPORT_FILE_NAME]: doExportFileNameSelected,
  [OPEN_EXPORT]: doOpenExport,
  [CLOSE_EXPORT]: doCloseExport,
  [QUERY_CHANGED]: doQueryChanged,
  [TOGGLE_FULL_COLLECTION]: doToggleFullCollection
};

/**
 * The export module reducer.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The state.
 */
const reducer = (state = INITIAL_STATE, action) => {
  const fn = MAPPINGS[action.type];
  return fn ? fn(state, action) : state;
};

export default reducer;
