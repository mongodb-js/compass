import type { Reducer } from 'redux';
import toNS from 'mongodb-ns';
import { isEmpty } from 'lodash';
import type { Document } from 'hadron-document';
import type HadronDocument from 'hadron-document';
import { isAction } from './util';
import type { CrudThunkAction } from './reducer';
import type { CrudState, BSONObject, DocumentView } from './crud-types';
import {
  DEFAULT_NUM_PAGE_DOCS,
  COUNT_MAX_TIME_MS_CAP,
  MAX_DOCS_PER_PAGE_STORAGE_KEY,
  DEFAULT_INITIAL_MAX_TIME_MS,
} from './crud-types';
import {
  DOCUMENTS_STATUS_INITIAL,
  DOCUMENTS_STATUS_FETCHING,
  DOCUMENTS_STATUS_FETCHED_INITIAL,
  DOCUMENTS_STATUS_FETCHED_CUSTOM,
  DOCUMENTS_STATUS_FETCHED_PAGINATION,
  DOCUMENTS_STATUS_ERROR,
} from '../constants/documents-statuses';
import {
  fetchDocuments,
  countDocuments,
  fetchShardingKeys,
  objectContainsRegularExpression,
} from '../utils';
import { capMaxTimeMSAtPreferenceLimit } from 'compass-preferences-model/provider';
import type { CollationOptions } from 'mongodb';
import { mongoLogId } from '@mongodb-js/compass-logging/provider';
import { ExplainPlan } from '@mongodb-js/explain-plan-helper';
import type { Stage } from '@mongodb-js/explain-plan-helper';
import { validate } from 'mongodb-query-parser';
import type { Query } from '@mongodb-js/compass-query-bar';
import { EJSON } from 'bson';

// Action Types
export enum CrudActionTypes {
  FETCH_DOCUMENTS_START = 'compass-crud/FETCH_DOCUMENTS_START',
  FETCH_DOCUMENTS_SUCCESS = 'compass-crud/FETCH_DOCUMENTS_SUCCESS',
  FETCH_DOCUMENTS_ERROR = 'compass-crud/FETCH_DOCUMENTS_ERROR',
  UPDATE_PAGE = 'compass-crud/UPDATE_PAGE',
  VIEW_CHANGED = 'compass-crud/VIEW_CHANGED',
  UPDATE_MAX_DOCS_PER_PAGE = 'compass-crud/UPDATE_MAX_DOCS_PER_PAGE',
  UPDATE_COUNT = 'compass-crud/UPDATE_COUNT',
  SET_LOADING_COUNT = 'compass-crud/SET_LOADING_COUNT',
  SET_DEBOUNCING_LOAD = 'compass-crud/SET_DEBOUNCING_LOAD',
  CANCEL_OPERATION = 'compass-crud/CANCEL_OPERATION',
  UPDATE_DOCUMENT_SUCCESS = 'compass-crud/UPDATE_DOCUMENT_SUCCESS',
  REMOVE_DOCUMENT_SUCCESS = 'compass-crud/REMOVE_DOCUMENT_SUCCESS',
  UPDATE_COLLECTION_STATS = 'compass-crud/UPDATE_COLLECTION_STATS',
  UPDATE_INSTANCE_WRITABLE = 'compass-crud/UPDATE_INSTANCE_WRITABLE',
  UPDATE_INSTANCE_DESCRIPTION = 'compass-crud/UPDATE_INSTANCE_DESCRIPTION',
  COLLECTION_STATS_FETCHED = 'compass-crud/COLLECTION_STATS_FETCHED',
  UPDATE_COLLECTION_SCAN = 'compass-crud/UPDATE_COLLECTION_SCAN',
}

// Action Interfaces
export type FetchDocumentsStartAction = {
  type: CrudActionTypes.FETCH_DOCUMENTS_START;
  resultId: number;
  lastCountRunMaxTimeMS: number;
};

export type FetchDocumentsSuccessAction = {
  type: CrudActionTypes.FETCH_DOCUMENTS_SUCCESS;
  payload: {
    docs: Document[];
    start: number;
    end: number;
    page: number;
    shardKeys: BSONObject | null;
    resultId: number;
    status:
      | typeof DOCUMENTS_STATUS_FETCHED_INITIAL
      | typeof DOCUMENTS_STATUS_FETCHED_CUSTOM
      | typeof DOCUMENTS_STATUS_FETCHED_PAGINATION;
  };
};

export type FetchDocumentsErrorAction = {
  type: CrudActionTypes.FETCH_DOCUMENTS_ERROR;
  error: Error;
  resultId: number;
};

export type UpdatePageAction = {
  type: CrudActionTypes.UPDATE_PAGE;
  payload: {
    docs: Document[];
    start: number;
    end: number;
    page: number;
    resultId: number;
  };
};

export type ViewChangedAction = {
  type: CrudActionTypes.VIEW_CHANGED;
  view: DocumentView;
};

export type UpdateMaxDocsPerPageAction = {
  type: CrudActionTypes.UPDATE_MAX_DOCS_PER_PAGE;
  docsPerPage: number;
};

export type UpdateCountAction = {
  type: CrudActionTypes.UPDATE_COUNT;
  count: number | null;
};

export type SetLoadingCountAction = {
  type: CrudActionTypes.SET_LOADING_COUNT;
  loading: boolean;
};

export type SetDebouncingLoadAction = {
  type: CrudActionTypes.SET_DEBOUNCING_LOAD;
  debouncing: boolean;
};

export type CancelOperationAction = {
  type: CrudActionTypes.CANCEL_OPERATION;
};

export type UpdateDocumentSuccessAction = {
  type: CrudActionTypes.UPDATE_DOCUMENT_SUCCESS;
  payload: {
    index: number;
    doc: Document;
  };
};

export type RemoveDocumentSuccessAction = {
  type: CrudActionTypes.REMOVE_DOCUMENT_SUCCESS;
  payload: {
    index: number;
  };
};

export type UpdateCollectionStatsAction = {
  type: CrudActionTypes.UPDATE_COLLECTION_STATS;
  payload: {
    document_count: number;
    storage_size: number;
    free_storage_size: number;
    avg_document_size: number;
  };
};

export type UpdateInstanceWritableAction = {
  type: CrudActionTypes.UPDATE_INSTANCE_WRITABLE;
  payload: boolean;
};

export type UpdateInstanceDescriptionAction = {
  type: CrudActionTypes.UPDATE_INSTANCE_DESCRIPTION;
  payload: string;
};

export type CollectionStatsFetchedAction = {
  type: CrudActionTypes.COLLECTION_STATS_FETCHED;
  payload: {
    document_count: number;
    storage_size: number;
    free_storage_size: number;
    avg_document_size: number;
  };
};

export type UpdateCollectionScanAction = {
  type: CrudActionTypes.UPDATE_COLLECTION_SCAN;
  isCollectionScan: boolean;
};

export type CrudActions =
  | FetchDocumentsStartAction
  | FetchDocumentsSuccessAction
  | FetchDocumentsErrorAction
  | UpdatePageAction
  | ViewChangedAction
  | UpdateMaxDocsPerPageAction
  | UpdateCountAction
  | SetLoadingCountAction
  | SetDebouncingLoadAction
  | CancelOperationAction
  | UpdateDocumentSuccessAction
  | RemoveDocumentSuccessAction
  | UpdateCollectionStatsAction
  | UpdateInstanceWritableAction
  | UpdateInstanceDescriptionAction
  | CollectionStatsFetchedAction
  | UpdateCollectionScanAction;

// Action Creators
export const fetchDocumentsStart = (
  resultId: number,
  lastCountRunMaxTimeMS: number
): FetchDocumentsStartAction => ({
  type: CrudActionTypes.FETCH_DOCUMENTS_START,
  resultId,
  lastCountRunMaxTimeMS,
});

export const fetchDocumentsSuccess = (
  docs: Document[],
  start: number,
  end: number,
  page: number,
  shardKeys: BSONObject | null,
  resultId: number,
  status:
    | typeof DOCUMENTS_STATUS_FETCHED_INITIAL
    | typeof DOCUMENTS_STATUS_FETCHED_CUSTOM
    | typeof DOCUMENTS_STATUS_FETCHED_PAGINATION
): FetchDocumentsSuccessAction => ({
  type: CrudActionTypes.FETCH_DOCUMENTS_SUCCESS,
  payload: { docs, start, end, page, shardKeys, resultId, status },
});

export const fetchDocumentsError = (
  error: Error,
  resultId: number
): FetchDocumentsErrorAction => ({
  type: CrudActionTypes.FETCH_DOCUMENTS_ERROR,
  error,
  resultId,
});

export const viewChanged = (view: DocumentView): ViewChangedAction => ({
  type: CrudActionTypes.VIEW_CHANGED,
  view,
});

export const updateCount = (count: number | null): UpdateCountAction => ({
  type: CrudActionTypes.UPDATE_COUNT,
  count,
});

export const setLoadingCount = (loading: boolean): SetLoadingCountAction => ({
  type: CrudActionTypes.SET_LOADING_COUNT,
  loading,
});

export const setDebouncingLoad = (
  debouncing: boolean
): SetDebouncingLoadAction => ({
  type: CrudActionTypes.SET_DEBOUNCING_LOAD,
  debouncing,
});

export const cancelOperation = (): CancelOperationAction => ({
  type: CrudActionTypes.CANCEL_OPERATION,
});

export const updateCollectionScan = (
  isCollectionScan: boolean
): UpdateCollectionScanAction => ({
  type: CrudActionTypes.UPDATE_COLLECTION_SCAN,
  isCollectionScan,
});

// Helper Functions
function resultId() {
  return Math.floor(Math.random() * 2 ** 53);
}

function getInitialDocsPerPage(): number {
  const lastUsedDocsPerPageString = localStorage.getItem(
    MAX_DOCS_PER_PAGE_STORAGE_KEY
  );
  const lastUsedDocsPerPage = lastUsedDocsPerPageString
    ? parseInt(lastUsedDocsPerPageString)
    : null;
  return lastUsedDocsPerPage ?? DEFAULT_NUM_PAGE_DOCS;
}

export function getInitialCrudState(
  namespace: string,
  isReadonly: boolean,
  isTimeSeries: boolean,
  isSearchIndexesSupported: boolean,
  version: string,
  isDataLake: boolean,
  isWritable: boolean,
  instanceDescription: string,
  isUpdatePreviewSupported: boolean,
  collectionStats: {
    document_count: number;
    storage_size: number;
    free_storage_size: number;
    avg_document_size: number;
  } | null
): CrudState {
  return {
    ns: namespace,
    collection: toNS(namespace).collection,
    error: null,
    docs: [],
    start: 0,
    version,
    end: 0,
    page: 0,
    view: 'List',
    count: null,
    isDataLake,
    isReadonly,
    isTimeSeries,
    status: DOCUMENTS_STATUS_INITIAL,
    debouncingLoad: false,
    loadingCount: false,
    lastCountRunMaxTimeMS: COUNT_MAX_TIME_MS_CAP,
    shardKeys: null,
    resultId: resultId(),
    isWritable,
    instanceDescription,
    isCollectionScan: false,
    isSearchIndexesSupported,
    isUpdatePreviewSupported,
    docsPerPage: getInitialDocsPerPage(),
    collectionStats,
  };
}

// Thunk Actions
export const copyToClipboard = (
  doc: Document
): CrudThunkAction<void, CrudActions> => {
  return (_dispatch, _getState, { track, connectionInfoRef }) => {
    const state = _getState();
    if (!state.crud) return;
    track(
      'Document Copied',
      { mode: state.crud.view.toLowerCase() as 'list' | 'json' | 'table' },
      connectionInfoRef.current
    );
    const documentEJSON = doc.toEJSON();
    void navigator.clipboard.writeText(documentEJSON);
  };
};

export const updateMaxDocumentsPerPage = (
  docsPerPage: number
): CrudThunkAction<void, CrudActions> => {
  return (dispatch, getState) => {
    const state = getState().crud;
    if (!state) return;
    const previousDocsPerPage = state.docsPerPage;
    localStorage.setItem(MAX_DOCS_PER_PAGE_STORAGE_KEY, String(docsPerPage));
    dispatch({
      type: CrudActionTypes.UPDATE_MAX_DOCS_PER_PAGE,
      docsPerPage,
    });
    if (previousDocsPerPage !== docsPerPage) {
      void dispatch(refreshDocuments());
    }
  };
};

function isInitialQuery(query: Query = {}): boolean {
  return (
    isEmpty(query.filter) && isEmpty(query.project) && isEmpty(query.collation)
  );
}

function isCountHintSafe(query: { filter?: unknown }, isTimeSeries: boolean) {
  if (isTimeSeries) {
    return false;
  }
  if (query.filter && Object.keys(query.filter).length) {
    return false;
  }
  return true;
}

export const refreshDocuments = (
  onApply = false
): CrudThunkAction<Promise<void>, CrudActions> => {
  return async (dispatch, getState, extraArgs) => {
    const {
      dataService,
      queryBar,
      preferences,
      track,
      connectionInfoRef,
      logger,
      fieldStoreService,
      abortControllerRef,
      isTimeSeries,
      isReadonly,
      sourceName,
    } = extraArgs;

    const state = getState().crud;
    if (!state) return;

    if (dataService && !dataService.isConnected()) {
      logger.log.warn(
        mongoLogId(1_001_000_072),
        'Documents',
        'Trying to refresh documents but dataService is disconnected'
      );
      return;
    }

    const { ns, status, docsPerPage, version, isDataLake } = state;
    const query = queryBar.getLastAppliedQuery('crud');

    if (status === DOCUMENTS_STATUS_FETCHING) {
      return;
    }

    if (onApply) {
      const { defaultSortOrder } = preferences.getPreferences();
      track(
        'Query Executed',
        {
          has_projection:
            !!query.project && Object.keys(query.project).length > 0,
          has_skip: (query.skip ?? 0) > 0,
          has_sort: !!query.sort && Object.keys(query.sort).length > 0,
          default_sort: !defaultSortOrder
            ? 'none'
            : /_id/.test(defaultSortOrder)
            ? '_id'
            : 'natural',
          has_limit: (query.limit ?? 0) > 0,
          has_collation: !!query.collation,
          changed_maxtimems: query.maxTimeMS !== DEFAULT_INITIAL_MAX_TIME_MS,
          collection_type: isTimeSeries
            ? 'time-series'
            : isReadonly
            ? 'readonly'
            : 'collection',
          used_regex: objectContainsRegularExpression(query.filter ?? {}),
          mode: state.view.toLowerCase() as 'list' | 'json' | 'table',
        },
        connectionInfoRef.current
      );
    }

    // Create abort controller
    const abortController = new AbortController();
    const signal = abortController.signal;
    abortControllerRef.current = abortController;

    const fetchShardingKeysOptions = {
      maxTimeMS: capMaxTimeMSAtPreferenceLimit(preferences, query.maxTimeMS),
      signal,
    };

    const countOptions: Parameters<typeof countDocuments>[4] = {
      skip: query.skip,
      maxTimeMS: capMaxTimeMSAtPreferenceLimit(
        preferences,
        (query.maxTimeMS ?? 0) > COUNT_MAX_TIME_MS_CAP
          ? COUNT_MAX_TIME_MS_CAP
          : query.maxTimeMS
      ),
      signal,
      ...(query.hint
        ? {
            hint: query.hint,
          }
        : {}),
    };

    if (!countOptions.hint && isCountHintSafe(query, state.isTimeSeries)) {
      countOptions.hint = '_id_';
    }

    const isView = isReadonly && sourceName;
    const allowDefaultSort = !isView && !isTimeSeries;
    const { defaultSortOrder } = preferences.getPreferences();

    let sort = query.sort;
    if (!sort && allowDefaultSort && defaultSortOrder) {
      sort = validate('sort', defaultSortOrder);
    }

    const findOptions = {
      sort: sort ?? undefined,
      projection: query.project ?? undefined,
      skip: query.skip,
      limit: docsPerPage,
      collation: query.collation as CollationOptions,
      hint: query.hint ?? undefined,
      maxTimeMS: capMaxTimeMSAtPreferenceLimit(preferences, query.maxTimeMS),
      promoteValues: false,
      bsonRegExp: true,
    };

    if (query.limit && query.limit > 0) {
      countOptions.limit = query.limit;
      findOptions.limit = Math.min(docsPerPage, query.limit);
    }

    logger.log.info(
      mongoLogId(1_001_000_073),
      'Documents',
      'Refreshing documents',
      {
        ns,
        withFilter: !isEmpty(query.filter),
        findOptions,
        countOptions,
      }
    );

    // Check for collection scan
    if (!isEmpty(query.filter) || !isEmpty(query.sort)) {
      void dataService
        .explainFind(ns, query.filter ?? {}, findOptions, {
          explainVerbosity: 'queryPlanner',
          abortSignal: signal,
        })
        .then((rawExplainPlan) => {
          const explainPlan = new ExplainPlan(rawExplainPlan as Stage);
          dispatch(updateCollectionScan(explainPlan.isCollectionScan));
        })
        .catch(() => {
          // Ignore errors
        });
    } else {
      dispatch(updateCollectionScan(false));
    }

    // Start count in background
    countDocuments(
      dataService,
      preferences,
      ns,
      query.filter ?? {},
      countOptions,
      (err: Error) => {
        logger.log.warn(
          mongoLogId(1_001_000_288),
          'Documents',
          'Failed to count documents',
          err
        );
      }
    )
      .then((count) => {
        dispatch(updateCount(count));
        dispatch(setLoadingCount(false));
      })
      .catch((err) => {
        if (!dataService.isCancelError(err)) {
          throw err;
        }
        dispatch(setLoadingCount(false));
      });

    const promises = [
      fetchShardingKeys(dataService, ns, fetchShardingKeysOptions, (err) => {
        logger.log.warn(
          mongoLogId(1_001_000_075),
          'Documents',
          'Failed to fetch sharding keys',
          err
        );
      }),
      fetchDocuments(
        dataService,
        track,
        version,
        isDataLake,
        ns,
        query.filter ?? {},
        findOptions,
        {
          abortSignal: signal,
        }
      ),
    ] as const;

    const newResultId = resultId();
    dispatch(
      fetchDocumentsStart(
        newResultId,
        countOptions.maxTimeMS ?? COUNT_MAX_TIME_MS_CAP
      )
    );
    dispatch(setLoadingCount(true));

    // Debounce loading indicator
    dispatch(setDebouncingLoad(true));
    const debouncePromise = new Promise((resolve) => setTimeout(resolve, 200));
    void Promise.race([debouncePromise, Promise.all(promises)]).then(() => {
      dispatch(setDebouncingLoad(false));
    });

    try {
      const [shardKeys, docs] = await Promise.all(promises);

      const status = isInitialQuery(query)
        ? DOCUMENTS_STATUS_FETCHED_INITIAL
        : DOCUMENTS_STATUS_FETCHED_CUSTOM;

      dispatch(
        fetchDocumentsSuccess(
          docs,
          docs.length > 0 ? 1 : 0,
          docs.length,
          0,
          shardKeys as any,
          newResultId,
          status
        )
      );

      const firstDocObject = docs[0]?.generateObject();
      if (firstDocObject) {
        void fieldStoreService.updateFieldsFromDocuments(ns, [firstDocObject]);
      }
    } catch (error) {
      logger.log.error(
        mongoLogId(1_001_000_074),
        'Documents',
        'Failed to refresh documents',
        error
      );
      dispatch(fetchDocumentsError(error as Error, newResultId));
    }

    abortControllerRef.current = null;
  };
};

export const getPage = (
  page: number
): CrudThunkAction<Promise<void>, CrudActions> => {
  return async (dispatch, getState, extraArgs) => {
    const {
      dataService,
      queryBar,
      preferences,
      track,
      fieldStoreService,
      abortControllerRef,
    } = extraArgs;

    const state = getState().crud;
    if (!state) return;
    const { ns, status, docsPerPage, version, isDataLake } = state;

    if (page < 0 || status === DOCUMENTS_STATUS_FETCHING) {
      return;
    }

    const {
      filter,
      limit,
      sort,
      hint,
      project: projection,
      collation,
      maxTimeMS,
      skip: _skip = 0,
    } = queryBar.getLastAppliedQuery('crud');

    const skip = _skip + page * docsPerPage;

    let nextPageCount = docsPerPage;

    if (limit) {
      const remaining = limit - skip;
      if (remaining < 1) {
        return;
      }
      if (remaining < nextPageCount) {
        nextPageCount = remaining;
      }
    }

    const abortController = new AbortController();
    const signal = abortController.signal;
    abortControllerRef.current = abortController;

    const opts = {
      skip,
      limit: nextPageCount,
      hint: hint ?? undefined,
      sort: sort ?? undefined,
      projection: projection ?? undefined,
      collation: collation as CollationOptions,
      maxTimeMS: capMaxTimeMSAtPreferenceLimit(preferences, maxTimeMS),
      promoteValues: false,
      bsonRegExp: true,
    };

    const newResultId = resultId();
    dispatch(fetchDocumentsStart(newResultId, COUNT_MAX_TIME_MS_CAP));
    dispatch(setDebouncingLoad(true));
    const debouncePromise = new Promise((resolve) => setTimeout(resolve, 200));
    void Promise.race([debouncePromise]).then(() => {
      dispatch(setDebouncingLoad(false));
    });

    let error: Error | undefined;
    let documents: HadronDocument[];
    try {
      documents = await fetchDocuments(
        dataService,
        track,
        version,
        isDataLake,
        ns,
        filter ?? {},
        opts,
        {
          abortSignal: signal,
        }
      );
    } catch (err) {
      documents = [];
      error = err as Error;
    }

    const length = error ? 0 : documents.length;

    if (error) {
      dispatch(fetchDocumentsError(error, newResultId));
    } else {
      dispatch({
        type: CrudActionTypes.UPDATE_PAGE,
        payload: {
          docs: documents,
          start: length === 0 ? 0 : skip + 1,
          end: skip + length,
          page,
          resultId: newResultId,
        },
      });

      void fieldStoreService.updateFieldsFromDocuments(ns, [
        documents[0]?.generateObject(),
      ]);
    }

    abortControllerRef.current = null;
  };
};

export const openCreateIndexModal = (): CrudThunkAction<void, CrudActions> => {
  return (_dispatch, _getState, { localAppRegistry, queryBar }) => {
    localAppRegistry.emit('open-create-index-modal', {
      query: EJSON.serialize(queryBar.getLastAppliedQuery('crud')?.filter),
    });
  };
};

export const openCreateSearchIndexModal = (): CrudThunkAction<
  void,
  CrudActions
> => {
  return (_dispatch, _getState, { localAppRegistry }) => {
    localAppRegistry.emit('open-create-search-index-modal');
  };
};

// Reducer
const INITIAL_STATE: CrudState | null = null;

export const crudReducer: Reducer<CrudState | null> = (
  state = INITIAL_STATE,
  action
) => {
  if (
    isAction<FetchDocumentsStartAction>(
      action,
      CrudActionTypes.FETCH_DOCUMENTS_START
    )
  ) {
    if (!state) return state;
    return {
      ...state,
      status: DOCUMENTS_STATUS_FETCHING,
      error: null,
      count: null,
      loadingCount: true,
      lastCountRunMaxTimeMS: action.lastCountRunMaxTimeMS,
      resultId: action.resultId,
    };
  }

  if (
    isAction<FetchDocumentsSuccessAction>(
      action,
      CrudActionTypes.FETCH_DOCUMENTS_SUCCESS
    )
  ) {
    if (!state) return state;
    return {
      ...state,
      status: action.payload.status,
      error: null,
      docs: action.payload.docs,
      start: action.payload.start,
      end: action.payload.end,
      page: action.payload.page,
      shardKeys: action.payload.shardKeys,
      resultId: action.payload.resultId,
    };
  }

  if (
    isAction<FetchDocumentsErrorAction>(
      action,
      CrudActionTypes.FETCH_DOCUMENTS_ERROR
    )
  ) {
    if (!state) return state;
    return {
      ...state,
      status: DOCUMENTS_STATUS_ERROR,
      error: action.error,
      resultId: action.resultId,
    };
  }

  if (isAction<UpdatePageAction>(action, CrudActionTypes.UPDATE_PAGE)) {
    if (!state) return state;
    return {
      ...state,
      docs: action.payload.docs,
      start: action.payload.start,
      end: action.payload.end,
      page: action.payload.page,
      resultId: action.payload.resultId,
      status: DOCUMENTS_STATUS_FETCHED_PAGINATION,
    };
  }

  if (isAction<ViewChangedAction>(action, CrudActionTypes.VIEW_CHANGED)) {
    if (!state) return state;
    return {
      ...state,
      view: action.view,
    };
  }

  if (
    isAction<UpdateMaxDocsPerPageAction>(
      action,
      CrudActionTypes.UPDATE_MAX_DOCS_PER_PAGE
    )
  ) {
    if (!state) return state;
    return {
      ...state,
      docsPerPage: action.docsPerPage,
    };
  }

  if (isAction<UpdateCountAction>(action, CrudActionTypes.UPDATE_COUNT)) {
    if (!state) return state;
    return {
      ...state,
      count: action.count,
    };
  }

  if (
    isAction<SetLoadingCountAction>(action, CrudActionTypes.SET_LOADING_COUNT)
  ) {
    if (!state) return state;
    return {
      ...state,
      loadingCount: action.loading,
    };
  }

  if (
    isAction<SetDebouncingLoadAction>(
      action,
      CrudActionTypes.SET_DEBOUNCING_LOAD
    )
  ) {
    if (!state) return state;
    return {
      ...state,
      debouncingLoad: action.debouncing,
    };
  }

  if (
    isAction<CancelOperationAction>(action, CrudActionTypes.CANCEL_OPERATION)
  ) {
    if (!state) return state;
    return state;
  }

  if (
    isAction<UpdateDocumentSuccessAction>(
      action,
      CrudActionTypes.UPDATE_DOCUMENT_SUCCESS
    )
  ) {
    if (!state || !state.docs) return state;
    const newDocs = [...state.docs];
    newDocs[action.payload.index] = action.payload.doc;
    return {
      ...state,
      docs: newDocs,
    };
  }

  if (
    isAction<RemoveDocumentSuccessAction>(
      action,
      CrudActionTypes.REMOVE_DOCUMENT_SUCCESS
    )
  ) {
    if (!state || !state.docs) return state;
    const newDocs = [...state.docs];
    newDocs.splice(action.payload.index, 1);
    return {
      ...state,
      docs: newDocs,
      count: state.count === null ? null : state.count - 1,
      end: Math.max(state.end - 1, 0),
    };
  }

  if (
    isAction<CollectionStatsFetchedAction>(
      action,
      CrudActionTypes.COLLECTION_STATS_FETCHED
    )
  ) {
    if (!state) return state;
    return {
      ...state,
      collectionStats: action.payload,
    };
  }

  if (
    isAction<UpdateInstanceWritableAction>(
      action,
      CrudActionTypes.UPDATE_INSTANCE_WRITABLE
    )
  ) {
    if (!state) return state;
    return {
      ...state,
      isWritable: action.payload,
    };
  }

  if (
    isAction<UpdateInstanceDescriptionAction>(
      action,
      CrudActionTypes.UPDATE_INSTANCE_DESCRIPTION
    )
  ) {
    if (!state) return state;
    return {
      ...state,
      instanceDescription: action.payload,
    };
  }

  if (
    isAction<UpdateCollectionScanAction>(
      action,
      CrudActionTypes.UPDATE_COLLECTION_SCAN
    )
  ) {
    if (!state) return state;
    return {
      ...state,
      isCollectionScan: action.isCollectionScan,
    };
  }

  return state;
};
