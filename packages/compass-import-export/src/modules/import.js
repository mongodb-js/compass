import fs from 'fs';
import { Observable } from 'rxjs';
import streamToObservable from 'stream-to-observable';
import SplitLines from 'utils/split-lines-transform';
import PROCESS_STATUS from 'constants/process-status';
import FILE_TYPES from 'constants/file-types';
import { appRegistryEmit } from 'modules/app-registry';

/**
 * The prefix.
 */
const PREFIX = 'import-export/import';

/**
 * Import action name.
 */
export const IMPORT_ACTION = `${PREFIX}/IMPORT_ACTION`;

/**
 * Progress action name.
 */
export const IMPORT_PROGRESS = `${PREFIX}/IMPORT_PROGRESS`;

/**
 * Finised action name.
 */
export const IMPORT_FINISHED = `${PREFIX}/IMPORT_FINISHED`;

/**
 * Failed action name.
 */
export const IMPORT_FAILED = `${PREFIX}/IMPORT_FAILED`;

/**
 * Select file type action name.
 */
export const SELECT_IMPORT_FILE_TYPE = `${PREFIX}/SELECT_IMPORT_FILE_TYPE`;

/**
 * Select file name action name.
 */
export const SELECT_IMPORT_FILE_NAME = `${PREFIX}/SELECT_IMPORT_FILE_NAME`;

/**
 * Open action name.
 */
export const OPEN_IMPORT = `${PREFIX}/OPEN_IMPORT`;

/**
 * Close action name.
 */
export const CLOSE_IMPORT = `${PREFIX}/CLOSE_IMPORT`;

/**
 * Initial state.
 */
const INITIAL_STATE = {
  isOpen: false,
  progress: 0,
  error: null,
  fileName: '',
  fileType: FILE_TYPES.JSON,
  status: PROCESS_STATUS.UNSPECIFIED
};

/**
 * Finished statuses.
 */
const FINISHED_STATUS = [
  PROCESS_STATUS.COMPLETED,
  PROCESS_STATUS.CANCELED,
  PROCESS_STATUS.FAILED
];

let importStatus = PROCESS_STATUS.UNSPECIFIED;

/**
 * The import action.
 *
 * @param {String} status - The status.
 *
 * @returns {Object} The action.
 */
export const importAction = (status) => ({
  type: IMPORT_ACTION,
  status: status
});

/**
 * Select the file type of the import.
 *
 * @param {String} fileType - The file type.
 *
 * @returns {Object} The action.
 */
export const selectImportFileType = (fileType) => ({
  type: SELECT_IMPORT_FILE_TYPE,
  fileType: fileType
});

/**
 * Select the file name to import to.
 *
 * @param {String} fileName - The file name.
 *
 * @returns {Object} The action.
 */
export const selectImportFileName = (fileName) => ({
  type: SELECT_IMPORT_FILE_NAME,
  fileName: fileName
});

/**
 * Open the import modal.
 *
 * @returns {Object} The action.
 */
export const openImport = () => ({
  type: OPEN_IMPORT
});

/**
 * Close the import modal.
 *
 * @returns {Object} The action.
 */
export const closeImport = () => ({
  type: CLOSE_IMPORT
});

/**
 * Import progress action.
 *
 * @param {Number} progress - The progress.
 *
 * @returns {Object} The action.
 */
export const importProgress = (progress) => ({
  type: IMPORT_PROGRESS,
  progress: progress,
  error: null
});

/**
 * Import finished action creator.
 *
 * @returns {Object} The action.
 */
export const importFinished = () => ({
  type: IMPORT_FINISHED
});

/**
 * Action creator for imports that fail.
 *
 * @param {Error} error - The error.
 *
 * @returns {Object} The action.
 */
export const importFailed = (error) => ({
  type: IMPORT_FAILED,
  error: error
});

/**
 * Is the import finished?
 *
 * @returns {Boolean} If the import is finished.
 */
const isFinished = () => {
  return FINISHED_STATUS.includes(importStatus);
};

/**
 * Epic for handling the start of an import.
 *
 * @param {ActionsObservable} action$ - The actions observable.
 * @param {Store} store - The store.
 *
 * @returns {Epic} The epic.
 */
export const importStartedEpic = (action$, store) =>
  action$.ofType(IMPORT_ACTION)
    .flatMap(action => {
      importStatus = action.status;
      if (isFinished()) {
        return Observable.empty();
      }

      const { ns, dataService, importData } = store.getState();
      const { fileName, fileType } = importData;
      if (!fs.existsSync(fileName)) {
        return Observable.of(importFailed(new Error(`File ${fileName} not found`)));
      }
      const stats = fs.statSync(fileName);
      const fileSizeInBytes = stats.size;
      const frs = fs.createReadStream(fileName, 'utf8');
      const splitLines = new SplitLines(fileType);
      frs.pipe(splitLines);
      return streamToObservable(splitLines)
        .concatMap((docs) => {
          return dataService.putMany(ns, docs, { ordered: false })
            .then(() => {
              return importProgress((frs.bytesRead * 100) / fileSizeInBytes);
            });
        })
        .takeWhile(() => {
          return importStatus !== PROCESS_STATUS.CANCELED;
        })
        .catch((error) => {
          return Observable.of(importFailed(error));
        })
        .concat(Observable.of('').map(() => {
          return importFinished();
        }))
        .concat(Observable.of('').map(() => {
          return appRegistryEmit('import-finished');
        }))
        .finally(() => {
          splitLines.end();
          frs.close();
        });
    });

/**
 * Returns the state after the import action.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
export const doImportAction = (state, action) => ({
  ...state,
  progress: 0,
  status: action.status
});

/**
 * Returns the state after the import progress action.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
export const doImportProgress = (state, action) => ({
  ...state,
  progress: Number(action.progress.toFixed(2))
});

/**
 * Returns the state after the import completed action.
 *
 * @param {Object} state - The state.
 *
 * @returns {Object} The new state.
 */
export const doImportFinished = (state) => {
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
 * Returns the state after the import failed action.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
export const doImportFailed = (state, action) => ({
  ...state,
  error: action.error,
  progress: 100,
  status: PROCESS_STATUS.FAILED
});

/**
 * Returns the state after the file type selected action.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
export const doImportFileTypeSelected = (state, action) => ({
  ...state,
  fileType: action.fileType
});

/**
 * Returns the state after the file name selected action.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
export const doImportFileNameSelected = (state, action) => ({
  ...state,
  fileName: action.fileName
});

/**
 * Returns the state after the open action.
 *
 * @returns {Object} The new state.
 */
export const doOpenImport = () => ({
  ...INITIAL_STATE,
  isOpen: true
});

/**
 * Returns the state after the close action.
 *
 * @param {Object} state - The state.
 *
 * @returns {Object} The new state.
 */
export const doCloseImport = (state) => ({
  ...state,
  isOpen: false
});

/**
 * The reducer function mappings.
 */
const MAPPINGS = {
  [IMPORT_ACTION]: doImportAction,
  [IMPORT_PROGRESS]: doImportProgress,
  [IMPORT_FINISHED]: doImportFinished,
  [IMPORT_FAILED]: doImportFailed,
  [SELECT_IMPORT_FILE_TYPE]: doImportFileTypeSelected,
  [SELECT_IMPORT_FILE_NAME]: doImportFileNameSelected,
  [OPEN_IMPORT]: doOpenImport,
  [CLOSE_IMPORT]: doCloseImport
};

/**
 * The import module reducer.
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
