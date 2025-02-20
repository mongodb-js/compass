import _ from 'lodash';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import type { Reducer } from 'redux';
import PROCESS_STATUS from '../constants/process-status';
import FILE_TYPES from '../constants/file-types';
import type { ProcessStatus } from '../constants/process-status';
import type { AcceptedFileType } from '../constants/file-types';
import type {
  Delimiter,
  Linebreak,
  CSVParsableFieldType,
  CSVField,
} from '../csv/csv-types';
import type { ErrorJSON, ImportResult } from '../import/import-types';
import { csvHeaderNameToFieldName } from '../csv/csv-utils';
import { guessFileType } from '../import/guess-filetype';
import { listCSVFields } from '../import/list-csv-fields';
import { analyzeCSVFields } from '../import/analyze-csv-fields';
import type { AnalyzeCSVFieldsResult } from '../import/analyze-csv-fields';
import { importCSV } from '../import/import-csv';
import { importJSON } from '../import/import-json';
import { getUserDataFolderPath } from '../utils/get-user-data-file-path';
import {
  showBloatedDocumentSignalToast,
  showUnboundArraySignalToast,
  showCancelledToast,
  showCompletedToast,
  showCompletedWithErrorsToast,
  showFailedToast,
  showInProgressToast,
  showStartingToast,
} from '../components/import-toast';
import type { ImportThunkAction } from '../stores/import-store';
import { openFile } from '../utils/open-file';
import type { DataService } from 'mongodb-data-service';

const checkFileExists = promisify(fs.exists);
const getFileStats = promisify(fs.stat);

/**
 * ## Action names
 */
const PREFIX = 'import-export/import';
export const STARTED = `${PREFIX}/STARTED`;
export const CANCELED = `${PREFIX}/CANCELED`;
export const FINISHED = `${PREFIX}/FINISHED`;
export const FAILED = `${PREFIX}/FAILED`;
export const FILE_TYPE_SELECTED = `${PREFIX}/FILE_TYPE_SELECTED`;
export const FILE_SELECTED = `${PREFIX}/FILE_SELECTED`;
export const FILE_SELECT_ERROR = `${PREFIX}/FILE_SELECT_ERROR`;
export const OPEN = `${PREFIX}/OPEN`;
export const CLOSE = `${PREFIX}/CLOSE`;
export const OPEN_IN_PROGRESS_MESSAGE = `${PREFIX}/OPEN_IN_PROGRESS_MESSAGE`;
export const CLOSE_IN_PROGRESS_MESSAGE = `${PREFIX}/CLOSE_IN_PROGRESS_MESSAGE`;
export const SET_PREVIEW = `${PREFIX}/SET_PREVIEW`;
export const SET_DELIMITER = `${PREFIX}/SET_DELIMITER`;
export const SET_GUESSTIMATED_TOTAL = `${PREFIX}/SET_GUESSTIMATED_TOTAL`;
export const SET_STOP_ON_ERRORS = `${PREFIX}/SET_STOP_ON_ERRORS`;
export const SET_IGNORE_BLANKS = `${PREFIX}/SET_IGNORE_BLANKS`;
export const TOGGLE_INCLUDE_FIELD = `${PREFIX}/TOGGLE_INCLUDE_FIELD`;
export const SET_FIELD_TYPE = `${PREFIX}/SET_FIELD_TYPE`;
export const ANALYZE_STARTED = `${PREFIX}/ANALYZE_STARTED`;
export const ANALYZE_FINISHED = `${PREFIX}/ANALYZE_FINISHED`;
export const ANALYZE_FAILED = `${PREFIX}/ANALYZE_FAILED`;
export const ANALYZE_CANCELLED = `${PREFIX}/ANALYZE_CANCELLED`;
export const ANALYZE_PROGRESS = `${PREFIX}/ANALYZE_PROGRESS`;

export type FieldFromCSV = {
  isArray: boolean;
  path: string;
  checked: boolean;
  type: CSVParsableFieldType;
  result?: CSVField;
};
type FieldFromJSON = {
  path: string;
  checked: boolean;
};
type FieldType = FieldFromJSON | FieldFromCSV;

type ImportState = {
  isOpen: boolean;
  isInProgressMessageOpen: boolean;
  firstErrors: Error[];
  fileType: AcceptedFileType | '';
  fileName: string;
  errorLogFilePath: string;
  fileIsMultilineJSON: boolean;
  useHeaderLines: boolean;
  status: ProcessStatus;

  fileStats: null | fs.Stats;
  analyzeBytesProcessed: number;
  analyzeBytesTotal: number;
  delimiter: Delimiter;
  newline: Linebreak;
  stopOnErrors: boolean;

  ignoreBlanks: boolean;
  fields: FieldType[];
  values: string[][];
  previewLoaded: boolean;
  exclude: string[];
  transform: [string, CSVParsableFieldType][];

  abortController?: AbortController;
  analyzeAbortController?: AbortController;

  analyzeResult?: AnalyzeCSVFieldsResult;
  analyzeStatus: ProcessStatus;
  analyzeError?: Error;

  connectionId: string;
  namespace: string;
};

export const INITIAL_STATE: ImportState = {
  isOpen: false,
  isInProgressMessageOpen: false,
  firstErrors: [],
  fileName: '',
  errorLogFilePath: '',
  fileIsMultilineJSON: false,
  useHeaderLines: true,
  status: PROCESS_STATUS.UNSPECIFIED,
  fileStats: null,
  analyzeBytesProcessed: 0,
  analyzeBytesTotal: 0,
  delimiter: ',',
  newline: '\n',
  stopOnErrors: false,
  ignoreBlanks: true,
  fields: [],
  values: [],
  previewLoaded: false,
  exclude: [],
  transform: [],
  fileType: '',
  analyzeStatus: PROCESS_STATUS.UNSPECIFIED,
  namespace: '',
  connectionId: '',
};

export const onStarted = ({
  abortController,
  errorLogFilePath,
}: {
  abortController: AbortController;
  errorLogFilePath: string;
}) => ({
  type: STARTED,
  abortController,
  errorLogFilePath,
});

const onFinished = ({
  aborted,
  firstErrors,
}: {
  aborted: boolean;
  firstErrors: Error[];
}) => ({
  type: FINISHED,
  aborted,
  firstErrors,
});

const onFailed = (error: Error) => ({ type: FAILED, error });

const onFileSelectError = (error: Error) => ({
  type: FILE_SELECT_ERROR,
  error,
});

async function getErrorLogPath(fileName: string) {
  // Create the error log output file.
  const userDataPath = getUserDataFolderPath();
  const importErrorLogsPath = path.join(userDataPath, 'ImportErrorLogs');
  await fs.promises.mkdir(importErrorLogsPath, { recursive: true });

  const errorLogFileName = `import-${path.basename(fileName)}.log`;

  return path.join(importErrorLogsPath, errorLogFileName);
}

export const startImport = (): ImportThunkAction<Promise<void>> => {
  return async (
    dispatch,
    getState,
    {
      connections,
      globalAppRegistry: appRegistry,
      workspaces,
      track,
      logger: { log, mongoLogId, debug },
    }
  ) => {
    const startTime = Date.now();

    const {
      import: {
        fileName,
        fileType,
        fileIsMultilineJSON,
        fileStats,
        delimiter,
        newline,
        ignoreBlanks: ignoreBlanks_,
        stopOnErrors,
        exclude,
        transform,
        namespace: ns,
        connectionId,
      },
    } = getState();

    const ignoreBlanks = ignoreBlanks_ && fileType === FILE_TYPES.CSV;
    const fileSize = fileStats?.size || 0;
    const fields: Record<string, CSVParsableFieldType> = {};
    for (const [name, type] of transform) {
      if (exclude.includes(name)) {
        continue;
      }
      fields[name] = type;
    }
    const input = fs.createReadStream(fileName, 'utf8');

    const firstErrors: ErrorJSON[] = [];

    let errorLogFilePath: string | undefined;
    let errorLogWriteStream: fs.WriteStream | undefined;
    try {
      errorLogFilePath = await getErrorLogPath(fileName);

      errorLogWriteStream = errorLogFilePath
        ? fs.createWriteStream(errorLogFilePath)
        : undefined;
    } catch (err: any) {
      (err as Error).message = `unable to create import error log file: ${
        (err as Error).message
      }`;
      firstErrors.push(err as Error);
    }

    log.info(
      mongoLogId(1001000080),
      'Import',
      'Start reading from source file',
      {
        ns,
        fileName,
        fileType,
        fileIsMultilineJSON,
        fileSize,
        delimiter,
        ignoreBlanks,
        stopOnErrors,
        errorLogFilePath,
        exclude,
        transform,
      }
    );

    const abortController = new AbortController();
    const abortSignal = abortController.signal;
    dispatch(
      onStarted({
        abortController,
        errorLogFilePath: errorLogFilePath || '',
      })
    );

    showStartingToast({
      cancelImport: () => dispatch(cancelImport()),
      fileName,
    });

    let numErrors = 0;
    const errorCallback = (err: ErrorJSON) => {
      numErrors += 1;
      if (firstErrors.length < 5) {
        // Only store the first few errors in memory.
        // The log file tracks all of them.
        // If we are importing a massive file with many errors we don't
        // want to run out of memory. We show the first few errors in the UI.
        firstErrors.push(err);
      }
    };

    const progressCallback = _.throttle(function ({
      docsWritten,
      bytesProcessed,
    }: {
      docsWritten: number;
      bytesProcessed: number;
    }) {
      showInProgressToast({
        cancelImport: () => dispatch(cancelImport()),
        docsWritten,
        numErrors,
        fileName,
        bytesProcessed,
        bytesTotal: fileSize,
      });
    },
    1000);

    let dataService: DataService | undefined;
    let result: ImportResult;
    try {
      if (!connectionId) {
        throw new Error('ConnectionId not provided');
      }

      dataService = connections.getDataServiceForConnection(connectionId);

      if (fileType === 'csv') {
        result = await importCSV({
          dataService,
          ns,
          input,
          output: errorLogWriteStream,
          delimiter,
          newline,
          fields,
          abortSignal,
          progressCallback,
          errorCallback,
          stopOnErrors,
          ignoreEmptyStrings: ignoreBlanks,
        });
      } else {
        result = await importJSON({
          dataService,
          ns,
          input,
          output: errorLogWriteStream,
          abortSignal,
          stopOnErrors,
          jsonVariant: fileIsMultilineJSON ? 'jsonl' : 'json',
          progressCallback,
          errorCallback,
        });
      }

      progressCallback.flush();
    } catch (err: any) {
      track(
        'Import Completed',
        {
          duration: Date.now() - startTime,
          delimiter: fileType === 'csv' ? delimiter ?? ',' : undefined,
          newline: fileType === 'csv' ? newline : undefined,
          file_type: fileType,
          all_fields: exclude.length === 0,
          stop_on_error_selected: stopOnErrors,
          number_of_docs: err.result?.docsWritten,
          success: !err,
          aborted: abortSignal.aborted,
          ignore_empty_strings: fileType === 'csv' ? ignoreBlanks : undefined,
        },
        connections.getConnectionById(connectionId)?.info
      );

      log.error(mongoLogId(1001000081), 'Import', 'Import failed', {
        ns,
        errorLogFilePath,
        docsWritten: err.result?.docsWritten,
        error: err.message,
      });
      debug('Error while importing:', err.stack);

      progressCallback.flush();
      showFailedToast(err);

      dispatch(onFailed(err));
      return;
    } finally {
      errorLogWriteStream?.close();
    }

    track(
      'Import Completed',
      {
        duration: Date.now() - startTime,
        delimiter: fileType === 'csv' ? delimiter ?? ',' : undefined,
        newline: fileType === 'csv' ? newline : undefined,
        file_type: fileType,
        all_fields: exclude.length === 0,
        stop_on_error_selected: stopOnErrors,
        number_of_docs: result.docsWritten,
        success: true,
        aborted: result.aborted,
        ignore_empty_strings: fileType === 'csv' ? ignoreBlanks : undefined,
      },
      connections.getConnectionById(connectionId)?.info
    );

    log.info(mongoLogId(1001000082), 'Import', 'Import completed', {
      ns,
      docsWritten: result.docsWritten,
      docsProcessed: result.docsProcessed,
    });

    const openErrorLogFilePathActionHandler = errorLogFilePath
      ? () => {
          if (errorLogFilePath) {
            track(
              'Import Error Log Opened',
              {
                errorCount: numErrors,
              },
              connections.getConnectionById(connectionId)?.info
            );
            void openFile(errorLogFilePath);
          }
        }
      : undefined;

    if (result.aborted) {
      showCancelledToast({
        errors: firstErrors,
        actionHandler: openErrorLogFilePathActionHandler,
      });
    } else {
      const onReviewDocumentsClick = appRegistry
        ? () => {
            workspaces.openCollectionWorkspace(connectionId, ns, {
              newTab: true,
            });
          }
        : undefined;

      if (result.biggestDocSize > 10_000_000) {
        showBloatedDocumentSignalToast({ onReviewDocumentsClick });
      }

      if (result.hasUnboundArray) {
        showUnboundArraySignalToast({ onReviewDocumentsClick });
      }

      if (firstErrors.length > 0) {
        showCompletedWithErrorsToast({
          docsWritten: result.docsWritten,
          errors: firstErrors,
          docsProcessed: result.docsProcessed,
          actionHandler: openErrorLogFilePathActionHandler,
        });
      } else {
        showCompletedToast({
          docsWritten: result.docsWritten,
        });
      }
    }

    dispatch(
      onFinished({
        aborted: !!result.aborted,
        firstErrors,
      })
    );

    const payload = {
      ns,
      size: fileSize,
      fileType,
      docsWritten: result.docsWritten,
      fileIsMultilineJSON,
      delimiter,
      ignoreBlanks,
      stopOnErrors,
      hasExcluded: exclude.length > 0,
      hasTransformed: transform.length > 0,
    };

    // Don't emit when the data service is disconnected
    if (dataService?.isConnected()) {
      appRegistry.emit('import-finished', payload, {
        connectionId,
      });
    }
  };
};

export const connectionDisconnected = (
  connectionId: string
): ImportThunkAction<void> => {
  return (dispatch, getState, { logger: { debug } }) => {
    const currentConnectionId = getState().import.connectionId;
    debug('connectionDisconnected', { connectionId, currentConnectionId });
    if (connectionId === currentConnectionId) {
      dispatch(cancelImport());
    }
  };
};

/**
 * Cancels an active import if there is one, noop if not.
 *
 * @api public
 */
export const cancelImport = (): ImportThunkAction<void> => {
  return (dispatch, getState, { logger: { debug } }) => {
    const {
      import: { abortController, analyzeAbortController },
    } = getState();

    // The user could close the modal while a analyzeCSVFields() is running
    if (analyzeAbortController) {
      debug('cancelling analyzeCSVFields');
      analyzeAbortController.abort();

      debug('analyzeCSVFields canceled by user');
      dispatch({ type: ANALYZE_CANCELLED });
    }

    // The user could close the modal while a importCSV() or importJSON() is running
    if (abortController) {
      debug('cancelling import');
      abortController.abort();

      debug('import canceled by user');
      dispatch({ type: CANCELED });
    } else {
      debug('no active import to cancel.');
    }
  };
};

export const skipCSVAnalyze = (): ImportThunkAction<void> => {
  return (dispatch, getState, { logger: { debug } }) => {
    const {
      import: { analyzeAbortController },
    } = getState();

    // cancelling analyzeCSVFields() still makes it resolve, the result is just
    // based on a smaller sample size. It will still detect something based on
    // however far it got into the file.
    if (analyzeAbortController) {
      debug('cancelling analyzeCSVFields');
      analyzeAbortController.abort();

      debug('analyzeCSVFields canceled by user');
      dispatch({ type: ANALYZE_CANCELLED });
    }
  };
};

const loadTypes = (
  fields: FieldFromCSV[],
  values: string[][]
): ImportThunkAction<Promise<void>> => {
  return async (dispatch, getState, { logger: { log, mongoLogId } }) => {
    const {
      fileName,
      delimiter,
      newline,
      ignoreBlanks,
      analyzeAbortController,
    } = getState().import;

    // if there's already an analyzeCSVFields in flight, abort that first
    if (analyzeAbortController) {
      analyzeAbortController.abort();
      dispatch(skipCSVAnalyze());
    }

    const abortController = new AbortController();
    const abortSignal = abortController.signal;
    const fileStats = await getFileStats(fileName);
    const fileSize = fileStats?.size || 0;
    dispatch({
      type: ANALYZE_STARTED,
      abortController,
      analyzeBytesTotal: fileSize,
    });

    const input = fs.createReadStream(fileName);

    const progressCallback = _.throttle(function ({
      bytesProcessed,
    }: {
      bytesProcessed: number;
    }) {
      dispatch({
        type: ANALYZE_PROGRESS,
        analyzeBytesProcessed: bytesProcessed,
      });
    },
    1000);

    try {
      const result = await analyzeCSVFields({
        input,
        delimiter,
        newline,
        abortSignal,
        ignoreEmptyStrings: ignoreBlanks,
        progressCallback,
      });

      for (const csvField of fields) {
        csvField.type = result.fields[csvField.path].detected;

        csvField.result = result.fields[csvField.path];
      }

      dispatch({
        type: SET_PREVIEW,
        fields,
        values,
      });

      dispatch({
        type: ANALYZE_FINISHED,
        result,
      });
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_180),
        'Import',
        'Failed to analyze CSV fields',
        err
      );
      dispatch({
        type: ANALYZE_FAILED,
        error: err,
      });
    }
  };
};

const loadCSVPreviewDocs = (): ImportThunkAction<Promise<void>> => {
  return async (dispatch, getState, { logger: { log, mongoLogId } }) => {
    const { fileName, delimiter, newline } = getState().import;

    const input = fs.createReadStream(fileName);

    try {
      const result = await listCSVFields({ input, delimiter, newline });

      const fieldMap: Record<string, number[]> = {};
      const fields: FieldFromCSV[] = [];

      // group the array fields' cells together so that large arrays don't kill
      // performance and cause excessive horizontal scrolling
      for (const [index, name] of result.headerFields.entries()) {
        const uniqueName = csvHeaderNameToFieldName(name);
        if (fieldMap[uniqueName]) {
          fieldMap[uniqueName].push(index);
        } else {
          fieldMap[uniqueName] = [index];
          fields.push({
            // foo[] is an array, foo[].bar is not even though we group its
            // preview items together.
            isArray: uniqueName.endsWith('[]'),
            path: uniqueName,
            checked: true,
            type: 'mixed',
          });
        }
      }

      const values: string[][] = [];
      for (const row of result.preview) {
        const transformed: string[] = [];
        for (const field of fields) {
          if (fieldMap[field.path].length === 1) {
            // if this is either not an array or an array of length one, just
            // use the value as is
            const cellValue = row[fieldMap[field.path][0]];
            transformed.push(cellValue);
          } else {
            // if multiple cells map to the same unique field, then join all the
            // cells for the same unique field together into one array
            const cellValues = fieldMap[field.path]
              .map((index) => row[index])
              .filter((value) => value.length > 0);
            // present values in foo[] as an array
            // present values in foo[].bar as just a list of examples
            const previewText = field.isArray
              ? JSON.stringify(cellValues, null, 2)
              : cellValues.join(', ');
            transformed.push(previewText);
          }
        }
        values.push(transformed);
      }

      await dispatch(loadTypes(fields, values));
    } catch (err) {
      log.error(
        mongoLogId(1001000097),
        'Import',
        'Failed to load preview docs',
        err
      );

      // The most likely way to get here is if the file is not encoded as UTF8.
      dispatch({
        type: ANALYZE_FAILED,
        error: err,
      });
    }
  };
};

/**
 * Mark a field to be included or excluded from the import.
 *
 * @param {String} path Dot notation path of the field.
 * @api public
 */
export const toggleIncludeField = (path: string) => ({
  type: TOGGLE_INCLUDE_FIELD,
  path: path,
});

/**
 * Specify the `type` values at `path` should be cast to.
 *
 * @param {String} path Dot notation accessor for value.
 * @param {String} bsonType A bson type identifier.
 * @example
 * ```javascript
 * //  Cast string _id from a csv to a bson.ObjectId
 * setFieldType('_id', 'ObjectId');
 * // Cast `{stats: {flufiness: "100"}}` to
 * // `{stats: {flufiness: 100}}`
 * setFieldType('stats.flufiness', 'Int32');
 * ```
 */
export const setFieldType = (path: string, bsonType: string) => {
  return {
    type: SET_FIELD_TYPE,
    path: path,
    bsonType: bsonType,
  };
};

export const selectImportFileName = (
  fileName: string
): ImportThunkAction<Promise<void>> => {
  return async (dispatch, _getState, { logger: { log, mongoLogId } }) => {
    try {
      const exists = await checkFileExists(fileName);
      if (!exists) {
        throw new Error(`File ${fileName} not found`);
      }
      const fileStats = await getFileStats(fileName);

      const input = fs.createReadStream(fileName, 'utf8');
      const detected = await guessFileType({ input });

      if (detected.type === 'unknown') {
        throw new Error('Cannot determine the file type');
      }

      // This is temporary. The store should just work with one fileType var
      const fileIsMultilineJSON = detected.type === 'jsonl';
      const fileType = detected.type === 'jsonl' ? 'json' : detected.type;

      dispatch({
        type: FILE_SELECTED,
        delimiter: detected.type === 'csv' ? detected.csvDelimiter : undefined,
        newline: detected.type === 'csv' ? detected.newline : undefined,
        fileName,
        fileStats,
        fileIsMultilineJSON,
        fileType,
      });

      // We only ever display preview rows for CSV files underneath the field
      // type selects
      if (detected.type === 'csv') {
        await dispatch(loadCSVPreviewDocs());
      }
    } catch (err: any) {
      log.info(
        mongoLogId(1_001_000_189),
        'Import',
        'Import select file error',
        {
          fileName,
          error: err?.message,
        }
      );

      if (
        err?.message?.includes(
          'The encoded data was not valid for encoding utf-8'
        )
      ) {
        err.message = `Unable to load the file. Make sure the file is valid CSV or JSON. Error: ${
          err?.message as string
        }`;
      }

      dispatch(onFileSelectError(new Error(err)));
    }
  };
};

/**
 * Set the tabular delimiter.
 */
export const setDelimiter = (
  delimiter: Delimiter
): ImportThunkAction<Promise<void>> => {
  return async (dispatch, getState, { logger: { debug } }) => {
    const { fileName, fileType, fileIsMultilineJSON } = getState().import;
    dispatch({
      type: SET_DELIMITER,
      delimiter: delimiter,
    });

    // NOTE: The preview could still be loading and then we'll have two
    // loadCSVPreviewDocs() actions being dispatched simultaneously. The newer
    // one should finish last and just override whatever the previous one gets,
    // so hopefully fine.
    if (fileType === 'csv') {
      debug('preview needs updating because delimiter changed', {
        fileName,
        fileType,
        delimiter,
        fileIsMultilineJSON,
      });
      await dispatch(loadCSVPreviewDocs());
    }
  };
};

/**
 * Stop the import if mongo returns an error for a document write
 * such as a duplicate key for a unique index. In practice,
 * the cases for this being false when importing are very minimal.
 * For example, a duplicate unique key on _id is almost always caused
 * by the user attempting to resume from a previous import without
 * removing all documents sucessfully imported.
 *
 * @see import/import-writer.ts, import-utils.ts
 * @see https://www.mongodb.com/docs/database-tools/mongoimport/#std-option-mongoimport.--stopOnError
 */
export const setStopOnErrors = (stopOnErrors: boolean) => ({
  type: SET_STOP_ON_ERRORS,
  stopOnErrors: stopOnErrors,
});

/**
 * Any `value` that is `''` will not have this field set in the final
 * document written to mongo.
 *
 * @see https://www.mongodb.com/docs/database-tools/mongoimport/#std-option-mongoimport.--ignoreBlanks
 */
export const setIgnoreBlanks = (ignoreBlanks: boolean) => ({
  type: SET_IGNORE_BLANKS,
  ignoreBlanks: ignoreBlanks,
});

/**
 * ### Top-level modal visibility
 */

/**
 * Open the import modal.
 */
export const openImport = ({
  connectionId,
  namespace,
  origin,
}: {
  connectionId: string;
  namespace: string;
  origin: 'menu' | 'crud-toolbar' | 'empty-state';
}): ImportThunkAction<void> => {
  return (dispatch, getState, { track, connections }) => {
    const { status } = getState().import;
    if (status === 'STARTED') {
      dispatch({
        type: OPEN_IN_PROGRESS_MESSAGE,
      });
      return;
    }
    track(
      'Import Opened',
      { origin },
      connections.getConnectionById(connectionId)?.info
    );
    dispatch({ type: OPEN, namespace, connectionId });
  };
};

/**
 * Close the import modal.
 * @api public
 */
export const closeImport = () => ({
  type: CLOSE,
});

export const closeInProgressMessage = () => ({
  type: CLOSE_IN_PROGRESS_MESSAGE,
});

function csvFields(fields: (FieldFromCSV | FieldFromJSON)[]): FieldFromCSV[] {
  return fields.filter(
    (field) => (field as FieldFromCSV).type !== undefined
  ) as unknown as FieldFromCSV[];
}

/**
 * The import module reducer.
 */
// TODO: Use Recuder<ImportState, Action> + isAction
export const importReducer: Reducer<ImportState> = (
  state = INITIAL_STATE,
  action
) => {
  if (action.type === FILE_SELECTED) {
    return {
      ...state,
      delimiter: action.delimiter,
      newline: action.newline,
      fileName: action.fileName,
      fileType: action.fileType,
      fileStats: action.fileStats,
      fileIsMultilineJSON: action.fileIsMultilineJSON,
      status: PROCESS_STATUS.UNSPECIFIED,
      firstErrors: [],
      abortController: undefined,
      analyzeAbortController: undefined,
      fields: [],
    };
  }

  /**
   * ## Options
   */
  if (action.type === FILE_TYPE_SELECTED) {
    return {
      ...state,
      fileType: action.fileType,
    };
  }

  if (action.type === SET_STOP_ON_ERRORS) {
    return {
      ...state,
      stopOnErrors: action.stopOnErrors,
    };
  }

  if (action.type === SET_IGNORE_BLANKS) {
    return {
      ...state,
      ignoreBlanks: action.ignoreBlanks,
    };
  }

  if (action.type === SET_DELIMITER) {
    return {
      ...state,
      delimiter: action.delimiter,
    };
  }

  /**
   * ## Preview and projection/data type options
   */
  if (action.type === SET_PREVIEW) {
    const newState = {
      ...state,
      values: action.values,
      fields: action.fields,
      previewLoaded: true,
      exclude: [],
    };

    newState.transform = (newState.fields as FieldFromCSV[])
      .filter((field) => field.checked)
      .map((field) => [field.path, field.type]);

    return newState;
  }
  /**
   * When checkbox next to a field is checked/unchecked
   */
  if (action.type === TOGGLE_INCLUDE_FIELD) {
    const newState = {
      ...state,
    };

    newState.fields = newState.fields.map((field) => {
      // you can't toggle a placeholder field
      field = field as FieldFromCSV | FieldFromJSON;

      if (field.path === action.path) {
        field.checked = !field.checked;
      }
      return field;
    });

    newState.transform = csvFields(newState.fields).map((field) => [
      field.path,
      field.type,
    ]);

    newState.exclude = newState.fields
      .filter((field) => !field.checked)
      .map((field) => field.path);

    return newState;
  }

  /**
   * Changing field type from a select dropdown.
   */
  if (action.type === SET_FIELD_TYPE) {
    const newState = {
      ...state,
    };

    newState.fields = newState.fields.map((field) => {
      if (field.path === action.path) {
        // you can only set the type of a csv field
        const csvField = field as FieldFromCSV;

        // If a user changes a field type, automatically check it for them
        // so they don't need an extra click or forget to click it an get frustrated
        // like I did so many times :)
        csvField.checked = true;
        csvField.type = action.bsonType;

        return csvField;
      }

      return field;
    });

    newState.transform = csvFields(newState.fields)
      .filter((field) => field.checked)
      .map((field) => [field.path, field.type]);

    newState.exclude = newState.fields
      .filter((field) => !field.checked)
      .map((field) => field.path);

    return newState;
  }

  if (action.type === FILE_SELECT_ERROR) {
    return {
      ...state,
      firstErrors: [action.error],
    };
  }

  /**
   * ## Status/Progress
   */
  if (action.type === FAILED) {
    return {
      ...state,
      firstErrors: [action.error],
      status: PROCESS_STATUS.FAILED,
      abortController: undefined,
    };
  }

  if (action.type === STARTED) {
    return {
      ...state,
      isOpen: false,
      firstErrors: [],
      status: PROCESS_STATUS.STARTED,
      abortController: action.abortController,
      errorLogFilePath: action.errorLogFilePath,
    };
  }

  if (action.type === FINISHED) {
    const status = action.aborted
      ? PROCESS_STATUS.CANCELED
      : PROCESS_STATUS.COMPLETED;

    return {
      ...state,
      status,
      firstErrors: action.firstErrors,
      abortController: undefined,
    };
  }

  if (action.type === OPEN) {
    return {
      ...INITIAL_STATE,
      namespace: action.namespace,
      connectionId: action.connectionId,
      isOpen: true,
    };
  }

  if (action.type === CLOSE) {
    return {
      ...state,
      isOpen: false,
    };
  }

  if (action.type === OPEN_IN_PROGRESS_MESSAGE) {
    return {
      ...state,
      isInProgressMessageOpen: true,
    };
  }

  if (action.type === CLOSE_IN_PROGRESS_MESSAGE) {
    return {
      ...state,
      isInProgressMessageOpen: false,
    };
  }

  if (action.type === ANALYZE_STARTED) {
    return {
      ...state,
      analyzeStatus: PROCESS_STATUS.STARTED,
      analyzeAbortController: action.abortController,
      analyzeError: undefined,
      analyzeBytesProcessed: 0,
      analyzeBytesTotal: action.analyzeBytesTotal,
    };
  }
  if (action.type === ANALYZE_FINISHED) {
    return {
      ...state,
      analyzeStatus: PROCESS_STATUS.COMPLETED,
      analyzeAbortController: undefined,
      analyzeResult: action.result,
      analyzeError: undefined,
    };
  }
  if (action.type === ANALYZE_FAILED) {
    return {
      ...state,
      analyzeStatus: PROCESS_STATUS.FAILED,
      analyzeAbortController: undefined,
      analyzeError: action.error,
    };
  }
  if (action.type === ANALYZE_CANCELLED) {
    return {
      ...state,
      analyzeAbortController: undefined,
      analyzeError: undefined,
    };
  }
  if (action.type === ANALYZE_PROGRESS) {
    return {
      ...state,
      analyzeBytesProcessed: action.analyzeBytesProcessed,
    };
  }

  return state;
};
