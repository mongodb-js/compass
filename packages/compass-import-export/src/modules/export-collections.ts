import type { Action, AnyAction, Reducer } from 'redux';
import _ from 'lodash';

import { exportCollectionsToDirectory } from '../export/export-collections';
import type { ExportJSONFormat } from '../export/export-json';
import type { CSVExportPhase } from '../export/export-csv';
import {
  showExportCollectionsFailedToast,
  showExportCollectionsFinishedToast,
  showExportCollectionsInProgressToast,
} from '../components/export-collections-toast';
import type { ExportThunkAction } from '../stores/export-store';

export type ExportableCollection = {
  name: string;
  // Views are listed so users understand why they are missing from the
  // export, but they can't be selected.
  isView: boolean;
  count: number | undefined;
};

export type ExportCollectionsStatus =
  undefined | 'loading-collections' | 'select-collections' | 'in-progress';

export type ExportCollectionsState = {
  isOpen: boolean;
  connectionId: string;
  databaseName: string;
  status: ExportCollectionsStatus;
  collections: ExportableCollection[];
  selectedCollections: string[];
  errorLoadingCollections: string | undefined;
  exportAbortController: AbortController | undefined;
};

export const initialState: ExportCollectionsState = {
  isOpen: false,
  connectionId: '',
  databaseName: '',
  status: undefined,
  collections: [],
  selectedCollections: [],
  errorLoadingCollections: undefined,
  exportAbortController: undefined,
};

export const ExportCollectionsActionTypes = {
  Open: 'compass-import-export/export-collections/Open',
  Close: 'compass-import-export/export-collections/Close',
  LoadCollectionsSuccess:
    'compass-import-export/export-collections/LoadCollectionsSuccess',
  LoadCollectionsError:
    'compass-import-export/export-collections/LoadCollectionsError',
  ToggleCollection: 'compass-import-export/export-collections/ToggleCollection',
  ToggleAllCollections:
    'compass-import-export/export-collections/ToggleAllCollections',
  RunExport: 'compass-import-export/export-collections/RunExport',
  ExportFinished: 'compass-import-export/export-collections/ExportFinished',
} as const;

function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

type OpenAction = {
  type: typeof ExportCollectionsActionTypes.Open;
  connectionId: string;
  databaseName: string;
};

type CloseAction = {
  type: typeof ExportCollectionsActionTypes.Close;
};

type LoadCollectionsSuccessAction = {
  type: typeof ExportCollectionsActionTypes.LoadCollectionsSuccess;
  collections: ExportableCollection[];
};

type LoadCollectionsErrorAction = {
  type: typeof ExportCollectionsActionTypes.LoadCollectionsError;
  errorMessage: string;
};

type ToggleCollectionAction = {
  type: typeof ExportCollectionsActionTypes.ToggleCollection;
  collectionName: string;
};

type ToggleAllCollectionsAction = {
  type: typeof ExportCollectionsActionTypes.ToggleAllCollections;
};

type RunExportAction = {
  type: typeof ExportCollectionsActionTypes.RunExport;
  exportAbortController: AbortController;
};

type ExportFinishedAction = {
  type: typeof ExportCollectionsActionTypes.ExportFinished;
};

export const openExportCollections = ({
  connectionId,
  databaseName,
}: {
  connectionId: string;
  databaseName: string;
}): ExportThunkAction<Promise<void>> => {
  return async (dispatch, getState, { connections }) => {
    if (getState().exportCollections.status === 'in-progress') {
      return;
    }

    dispatch({
      type: ExportCollectionsActionTypes.Open,
      connectionId,
      databaseName,
    });

    try {
      const dataService = connections.getDataServiceForConnection(connectionId);
      const collections = await dataService.listCollections(databaseName);
      const exportable = await Promise.all(
        collections
          .filter((collection) => !collection.system)
          .map(async (collection): Promise<ExportableCollection> => {
            const isView = collection.type === 'view';
            const count = isView
              ? undefined
              : await dataService
                  .estimatedCount(`${databaseName}.${collection.name}`)
                  .catch(() => undefined);
            return { name: collection.name, isView, count };
          })
      );
      dispatch({
        type: ExportCollectionsActionTypes.LoadCollectionsSuccess,
        collections: _.sortBy(exportable, 'name'),
      });
    } catch (err) {
      dispatch({
        type: ExportCollectionsActionTypes.LoadCollectionsError,
        errorMessage:
          (err as Error | undefined)?.message ?? 'Failed to load collections.',
      });
    }
  };
};

export const closeExportCollections = (): CloseAction => ({
  type: ExportCollectionsActionTypes.Close,
});

export const toggleCollection = (
  collectionName: string
): ToggleCollectionAction => ({
  type: ExportCollectionsActionTypes.ToggleCollection,
  collectionName,
});

export const toggleAllCollections = (): ToggleAllCollectionsAction => ({
  type: ExportCollectionsActionTypes.ToggleAllCollections,
});

export const cancelExportCollections = (): ExportThunkAction<void> => {
  return (_dispatch, getState) => {
    getState().exportCollections.exportAbortController?.abort();
  };
};

export const connectionDisconnected = (
  connectionId: string
): ExportThunkAction<void> => {
  return (dispatch, getState) => {
    if (getState().exportCollections.connectionId === connectionId) {
      dispatch(cancelExportCollections());
      dispatch(closeExportCollections());
    }
  };
};

export const runExportCollections = ({
  directoryPath,
  fileType,
  jsonFormatVariant,
  escapeFormulae = true,
  includeMetadata,
}: {
  directoryPath: string;
  fileType: 'json' | 'csv';
  jsonFormatVariant: ExportJSONFormat;
  escapeFormulae?: boolean;
  includeMetadata: boolean;
}): ExportThunkAction<Promise<void>> => {
  return async (
    dispatch,
    getState,
    { connections, logger: { log, mongoLogId } }
  ) => {
    const { connectionId, databaseName, selectedCollections } =
      getState().exportCollections;

    const exportAbortController = new AbortController();
    dispatch({
      type: ExportCollectionsActionTypes.RunExport,
      exportAbortController,
    });

    log.info(
      mongoLogId(1_001_000_445),
      'Export',
      'Start exporting collections',
      {
        databaseName,
        collectionCount: selectedCollections.length,
        directoryPath,
        fileType,
        jsonFormatVariant: fileType === 'json' ? jsonFormatVariant : undefined,
        escapeFormulae: fileType === 'csv' ? escapeFormulae : undefined,
        includeMetadata,
      }
    );

    let collectionIndex = 0;
    const cancelExport = () => dispatch(cancelExportCollections());
    const progressCallback = _.throttle(
      (
        collectionName: string,
        docsWritten: number,
        csvPhase?: CSVExportPhase
      ) => {
        showExportCollectionsInProgressToast({
          databaseName,
          collectionName,
          collectionIndex,
          collectionCount: selectedCollections.length,
          docsWritten,
          csvPhase,
          cancelExport,
        });
      },
      1000
    );

    try {
      const dataService = connections.getDataServiceForConnection(connectionId);
      const result = await exportCollectionsToDirectory({
        databaseName,
        collectionNames: selectedCollections,
        directoryPath,
        dataService,
        fileType,
        variant: jsonFormatVariant,
        escapeFormulae,
        includeMetadata,
        abortSignal: exportAbortController.signal,
        onCollectionStart: (collectionName, index) => {
          collectionIndex = index;
          progressCallback(collectionName, 0);
          progressCallback.flush();
        },
        progressCallback,
      });
      progressCallback.cancel();

      log.info(
        mongoLogId(1_001_000_446),
        'Export',
        'Finished exporting collections',
        {
          databaseName,
          aborted: result.aborted,
          collections: result.collections.map(
            ({ collectionName, docsWritten, error }) => ({
              collectionName,
              docsWritten,
              error: error?.message,
            })
          ),
        }
      );

      showExportCollectionsFinishedToast({
        collections: result.collections,
        directoryPath,
        aborted: result.aborted,
      });
    } catch (err) {
      progressCallback.cancel();
      log.error(
        mongoLogId(1_001_000_447),
        'Export',
        'Exporting collections failed',
        { databaseName, error: (err as Error | undefined)?.message }
      );
      showExportCollectionsFailedToast(err as Error | undefined);
    } finally {
      dispatch({ type: ExportCollectionsActionTypes.ExportFinished });
    }
  };
};

export const exportCollectionsReducer: Reducer<
  ExportCollectionsState,
  Action
> = (state = initialState, action) => {
  if (isAction<OpenAction>(action, ExportCollectionsActionTypes.Open)) {
    return {
      ...initialState,
      isOpen: true,
      connectionId: action.connectionId,
      databaseName: action.databaseName,
      status: 'loading-collections',
    };
  }

  if (isAction<CloseAction>(action, ExportCollectionsActionTypes.Close)) {
    return state.status === 'in-progress'
      ? { ...state, isOpen: false }
      : initialState;
  }

  if (
    isAction<LoadCollectionsSuccessAction>(
      action,
      ExportCollectionsActionTypes.LoadCollectionsSuccess
    )
  ) {
    if (state.status !== 'loading-collections') {
      return state;
    }
    return {
      ...state,
      status: 'select-collections',
      collections: action.collections,
      // Start with every collection selected, the common case is exporting
      // the whole database.
      selectedCollections: action.collections
        .filter((collection) => !collection.isView)
        .map((collection) => collection.name),
    };
  }

  if (
    isAction<LoadCollectionsErrorAction>(
      action,
      ExportCollectionsActionTypes.LoadCollectionsError
    )
  ) {
    if (state.status !== 'loading-collections') {
      return state;
    }
    return {
      ...state,
      status: 'select-collections',
      errorLoadingCollections: action.errorMessage,
    };
  }

  if (
    isAction<ToggleCollectionAction>(
      action,
      ExportCollectionsActionTypes.ToggleCollection
    )
  ) {
    const isSelected = state.selectedCollections.includes(
      action.collectionName
    );
    return {
      ...state,
      selectedCollections: isSelected
        ? state.selectedCollections.filter(
            (name) => name !== action.collectionName
          )
        : // Keep the order of the list so the export runs top to bottom.
          state.collections
            .map((collection) => collection.name)
            .filter(
              (name) =>
                name === action.collectionName ||
                state.selectedCollections.includes(name)
            ),
    };
  }

  if (
    isAction<ToggleAllCollectionsAction>(
      action,
      ExportCollectionsActionTypes.ToggleAllCollections
    )
  ) {
    const selectable = state.collections
      .filter((collection) => !collection.isView)
      .map((collection) => collection.name);
    return {
      ...state,
      selectedCollections:
        state.selectedCollections.length === selectable.length
          ? []
          : selectable,
    };
  }

  if (
    isAction<RunExportAction>(action, ExportCollectionsActionTypes.RunExport)
  ) {
    return {
      ...state,
      isOpen: false,
      status: 'in-progress',
      exportAbortController: action.exportAbortController,
    };
  }

  if (
    isAction<ExportFinishedAction>(
      action,
      ExportCollectionsActionTypes.ExportFinished
    )
  ) {
    return initialState;
  }

  return state;
};
