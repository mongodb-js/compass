import fs from 'fs';
import { Observable } from 'rxjs';
import streamToObservable from 'stream-to-observable';
import SplitLines from 'utils/split-lines-transform';
import PROCESS_STATUS from 'constants/process-status';
import FILE_TYPES from 'constants/file-types';

/**
 * The prefix.
 */
const PREFIX = 'import-export/import';

/**
 * Import action name.
 */
const IMPORT_ACTION = `${PREFIX}/IMPORT_ACTION`;

/**
 * Progress action name.
 */
const IMPORT_PROGRESS = `${PREFIX}/IMPORT_PROGRESS`;

/**
 * Completed action name.
 */
const IMPORT_COMPLETED = `${PREFIX}/IMPORT_COMPLETED`;

/**
 * Canceled action name.
 */
const IMPORT_CANCELED = `${PREFIX}/IMPORT_CANCELED`;

/**
 * Failed action name.
 */
const IMPORT_FAILED = `${PREFIX}/IMPORT_FAILED`;

/**
 * Select file type action name.
 */
const SELECT_IMPORT_FILE_TYPE = `${PREFIX}/SELECT_IMPORT_FILE_TYPE`;

/**
 * Select file name action name.
 */
const SELECT_IMPORT_FILE_NAME = `${PREFIX}/SELECT_IMPORT_FILE_NAME`;

/**
 * Open action name.
 */
const OPEN_IMPORT = `${PREFIX}/OPEN_IMPORT`;

/**
 * Close action name.
 */
const CLOSE_IMPORT = `${PREFIX}/CLOSE_IMPORT`;

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
const importProgress = (progress) => ({
  type: IMPORT_PROGRESS,
  progress: progress
});

/**
 * Import finished action creator.
 *
 * @returns {Object} The action.
 */
const importFinished = () => ({
  type: importStatus !== PROCESS_STATUS.CANCELLED ? IMPORT_COMPLETED : IMPORT_CANCELED
});

/**
 * Action creator for imports that fail.
 *
 * @param {Error} error - The error.
 *
 * @returns {Object} The action.
 */
const importFailed = (error) => ({
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
        return Observable.of(importFailed(`File ${fileName} not found`));
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
          return importStatus !== PROCESS_STATUS.CANCELLED;
        })
        .catch((error) => {
          return Observable.of(importFailed(error));
        })
        .concat(Observable.of('').map(() => {
          return importFinished();
        }))
        .finally(() => {
          splitLines.end();
          frs.close();
        });
    });

const reducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case IMPORT_ACTION:
      return {
        ...state,
        progress: 0,
        status: action.status
      };
    case IMPORT_PROGRESS:
      return {
        ...state,
        progress: Number(action.progress.toFixed(2))
      };
    case IMPORT_COMPLETED:
      return {
        ...state,
        progress: 100,
        status: state.status === PROCESS_STATUS.FAILED ? PROCESS_STATUS.FAILED : PROCESS_STATUS.COMPLETED
      };
    case IMPORT_CANCELED:
      return {
        ...state,
        progress: 0,
        status: PROCESS_STATUS.CANCELED
      };
    case IMPORT_FAILED:
      return {
        ...state,
        error: action.error,
        progress: 100,
        status: PROCESS_STATUS.FAILED
      };
    case SELECT_IMPORT_FILE_TYPE:
      return {
        ...state,
        fileType: action.fileType
      };
    case SELECT_IMPORT_FILE_NAME:
      return {
        ...state,
        fileName: action.fileName
      };
    case OPEN_IMPORT:
      return {
        ...INITIAL_STATE,
        isOpen: true
      };
    case CLOSE_IMPORT:
      return {
        ...state,
        isOpen: false
      };
    default:
      return state;
  }
};

export default reducer;
