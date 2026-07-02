import type { Reducer } from 'redux';
import toNS from 'mongodb-ns';
import { findIndex, isEmpty } from 'lodash';
import HadronDocument from 'hadron-document';
import type { Document } from 'hadron-document';
import type { CollationOptions } from 'mongodb';
import { EJSON } from 'bson';
import { toJSString, validate } from 'mongodb-query-parser';
import type { Stage } from '@mongodb-js/explain-plan-helper';
import { ExplainPlan } from '@mongodb-js/explain-plan-helper';
import { mongoLogId } from '@mongodb-js/compass-logging/provider';
import { capMaxTimeMSAtPreferenceLimit } from 'compass-preferences-model/provider';
import type { Query } from '@mongodb-js/compass-query-bar';

import { isAction } from './util';
import type { CrudThunkAction } from './reducer';
import type { BSONObject } from './insert';
import {
  fetchDocuments,
  findAndModifyWithFLEFallback,
} from './fetch-documents';
import {
  countDocuments,
  fetchShardingKeys,
  objectContainsRegularExpression,
} from '../utils';
import type { DOCUMENTS_STATUSES } from '../constants/documents-statuses';
import {
  DOCUMENTS_STATUS_ERROR,
  DOCUMENTS_STATUS_FETCHED_CUSTOM,
  DOCUMENTS_STATUS_FETCHED_INITIAL,
  DOCUMENTS_STATUS_FETCHED_PAGINATION,
  DOCUMENTS_STATUS_FETCHING,
  DOCUMENTS_STATUS_INITIAL,
} from '../constants/documents-statuses';

/**
 * Default number of docs per page.
 */
export const DEFAULT_NUM_PAGE_DOCS = 25;

/**
 * Default max time ms for the first query which is not getting the value from
 * the query bar.
 */
const DEFAULT_INITIAL_MAX_TIME_MS = 60000;

/**
 * A cap for the maxTimeMS used for countDocuments. This value is used
 * in place of the query maxTimeMS unless that is smaller.
 *
 * Due to the limit of 20 documents the batch of data for the query is usually
 * ready sooner than the count.
 *
 * We want to make sure `count` does not hold back the query results for too
 * long after docs are returned.
 */
export const COUNT_MAX_TIME_MS_CAP = 5000;

/**
 * The key we use to persist the user selected maximum documents per page for
 * other tabs or for the next application start.
 * Exported only for test purpose
 */
export const MAX_DOCS_PER_PAGE_STORAGE_KEY = 'compass_crud-max_docs_per_page';

const DELETE_ERROR = new Error(
  'Cannot delete documents that do not have an _id field.'
);
const EMPTY_UPDATE_ERROR = new Error(
  'Unable to update, no changes have been made.'
);

type Mutable<T> = { -readonly [P in keyof T]: T[P] };

export type DocumentsState = {
  ns: string;
  collection: string;
  abortController: AbortController | null;
  error: Error | null;
  docs: Document[] | null;
  start: number;
  end: number;
  page: number;
  count: number | null;
  status: DOCUMENTS_STATUSES;
  shardKeys: null | BSONObject;
  resultId: number;
  isCollectionScan?: boolean;
  debouncingLoad: boolean;
  loadingCount: boolean;
  lastCountRunMaxTimeMS: number;
  docsPerPage: number;
};

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

export function getInitialDocumentsState(namespace: string): DocumentsState {
  return {
    ns: namespace,
    collection: toNS(namespace).collection,
    abortController: null,
    error: null,
    docs: [],
    start: 0,
    end: 0,
    page: 0,
    count: null,
    status: DOCUMENTS_STATUS_INITIAL,
    shardKeys: null,
    resultId: resultId(),
    isCollectionScan: false,
    debouncingLoad: false,
    loadingCount: false,
    lastCountRunMaxTimeMS: COUNT_MAX_TIME_MS_CAP,
    docsPerPage: getInitialDocsPerPage(),
  };
}

export const DocumentsActionTypes = {
  REFRESH_STARTED: 'crud/documents/REFRESH_STARTED',
  REFRESH_SUCCESS: 'crud/documents/REFRESH_SUCCESS',
  REFRESH_ERROR: 'crud/documents/REFRESH_ERROR',
  COUNT_FETCHED: 'crud/documents/COUNT_FETCHED',
  COUNT_FINISHED: 'crud/documents/COUNT_FINISHED',
  COLLECTION_SCAN_RESULT: 'crud/documents/COLLECTION_SCAN_RESULT',
  GET_PAGE_STARTED: 'crud/documents/GET_PAGE_STARTED',
  GET_PAGE_SUCCESS: 'crud/documents/GET_PAGE_SUCCESS',
  GET_PAGE_ERROR: 'crud/documents/GET_PAGE_ERROR',
  CANCEL_OPERATION: 'crud/documents/CANCEL_OPERATION',
  DEBOUNCING_LOAD_CHANGED: 'crud/documents/DEBOUNCING_LOAD_CHANGED',
  DOCUMENT_REMOVED: 'crud/documents/DOCUMENT_REMOVED',
  DOCUMENT_REPLACED: 'crud/documents/DOCUMENT_REPLACED',
  DOCS_PER_PAGE_CHANGED: 'crud/documents/DOCS_PER_PAGE_CHANGED',
  /** @internal Test-only — seed partial state for unit tests. */
  SEED_DOCUMENTS_TEST_STATE: 'crud/documents/SEED_DOCUMENTS_TEST_STATE',
} as const;

export type RefreshStartedAction = {
  type: typeof DocumentsActionTypes.REFRESH_STARTED;
  abortController: AbortController;
  lastCountRunMaxTimeMS: number;
};

export type RefreshSuccessAction = {
  type: typeof DocumentsActionTypes.REFRESH_SUCCESS;
  docs: Document[];
  shardKeys: BSONObject | null;
  status: DOCUMENTS_STATUSES;
};

export type RefreshErrorAction = {
  type: typeof DocumentsActionTypes.REFRESH_ERROR;
  error: Error;
};

export type CountFetchedAction = {
  type: typeof DocumentsActionTypes.COUNT_FETCHED;
  count: number | null;
};

export type CountFinishedAction = {
  type: typeof DocumentsActionTypes.COUNT_FINISHED;
};

export type CollectionScanResultAction = {
  type: typeof DocumentsActionTypes.COLLECTION_SCAN_RESULT;
  isCollectionScan: boolean;
};

export type GetPageStartedAction = {
  type: typeof DocumentsActionTypes.GET_PAGE_STARTED;
  abortController: AbortController;
};

export type GetPageSuccessAction = {
  type: typeof DocumentsActionTypes.GET_PAGE_SUCCESS;
  docs: Document[];
  start: number;
  end: number;
  page: number;
};

export type GetPageErrorAction = {
  type: typeof DocumentsActionTypes.GET_PAGE_ERROR;
  error: Error;
  page: number;
  start: number;
  end: number;
};

export type CancelOperationAction = {
  type: typeof DocumentsActionTypes.CANCEL_OPERATION;
};

export type DebouncingLoadChangedAction = {
  type: typeof DocumentsActionTypes.DEBOUNCING_LOAD_CHANGED;
  debouncingLoad: boolean;
};

export type DocumentRemovedAction = {
  type: typeof DocumentsActionTypes.DOCUMENT_REMOVED;
  index: number;
};

export type DocumentReplacedAction = {
  type: typeof DocumentsActionTypes.DOCUMENT_REPLACED;
  index: number;
  doc: Document;
};

export type DocsPerPageChangedAction = {
  type: typeof DocumentsActionTypes.DOCS_PER_PAGE_CHANGED;
  docsPerPage: number;
};

export type SeedDocumentsTestStateAction = {
  type: typeof DocumentsActionTypes.SEED_DOCUMENTS_TEST_STATE;
  state: Partial<DocumentsState>;
};

export type DocumentsActions =
  | RefreshStartedAction
  | RefreshSuccessAction
  | RefreshErrorAction
  | CountFetchedAction
  | CountFinishedAction
  | CollectionScanResultAction
  | GetPageStartedAction
  | GetPageSuccessAction
  | GetPageErrorAction
  | CancelOperationAction
  | DebouncingLoadChangedAction
  | DocumentRemovedAction
  | DocumentReplacedAction
  | DocsPerPageChangedAction
  | SeedDocumentsTestStateAction;

/**
 * Test-only helper to seed partial documents-slice state. Production code
 * should never dispatch this — it's a convenience for unit tests that previously
 * relied on direct Reflux state mutation.
 */
export function seedDocumentsTestState(
  state: Partial<DocumentsState>
): SeedDocumentsTestStateAction {
  return { type: DocumentsActionTypes.SEED_DOCUMENTS_TEST_STATE, state };
}

export function createDocumentsReducer(
  initialState: DocumentsState
): Reducer<DocumentsState> {
  return (state = initialState, action) => {
    if (isAction(action, DocumentsActionTypes.REFRESH_STARTED)) {
      return {
        ...state,
        status: DOCUMENTS_STATUS_FETCHING,
        abortController: action.abortController,
        error: null,
        count: null,
        loadingCount: true,
        lastCountRunMaxTimeMS: action.lastCountRunMaxTimeMS,
      };
    }
    if (isAction(action, DocumentsActionTypes.REFRESH_SUCCESS)) {
      return {
        ...state,
        status: action.status,
        error: null,
        docs: action.docs,
        page: 0,
        start: action.docs.length > 0 ? 1 : 0,
        end: action.docs.length,
        shardKeys: action.shardKeys,
        abortController: null,
        resultId: resultId(),
      };
    }
    if (isAction(action, DocumentsActionTypes.REFRESH_ERROR)) {
      return {
        ...state,
        status: DOCUMENTS_STATUS_ERROR,
        error: action.error,
        abortController: null,
        resultId: resultId(),
      };
    }
    if (isAction(action, DocumentsActionTypes.COUNT_FETCHED)) {
      return { ...state, count: action.count, loadingCount: false };
    }
    if (isAction(action, DocumentsActionTypes.COUNT_FINISHED)) {
      return { ...state, loadingCount: false };
    }
    if (isAction(action, DocumentsActionTypes.COLLECTION_SCAN_RESULT)) {
      return { ...state, isCollectionScan: action.isCollectionScan };
    }
    if (isAction(action, DocumentsActionTypes.GET_PAGE_STARTED)) {
      return {
        ...state,
        status: DOCUMENTS_STATUS_FETCHING,
        abortController: action.abortController,
        error: null,
      };
    }
    if (isAction(action, DocumentsActionTypes.GET_PAGE_SUCCESS)) {
      return {
        ...state,
        status: DOCUMENTS_STATUS_FETCHED_PAGINATION,
        error: null,
        docs: action.docs,
        start: action.start,
        end: action.end,
        page: action.page,
        resultId: resultId(),
        abortController: null,
      };
    }
    if (isAction(action, DocumentsActionTypes.GET_PAGE_ERROR)) {
      return {
        ...state,
        status: DOCUMENTS_STATUS_ERROR,
        error: action.error,
        docs: [],
        start: action.start,
        end: action.end,
        page: action.page,
        resultId: resultId(),
        abortController: null,
      };
    }
    if (isAction(action, DocumentsActionTypes.CANCEL_OPERATION)) {
      return { ...state, abortController: null };
    }
    if (isAction(action, DocumentsActionTypes.DEBOUNCING_LOAD_CHANGED)) {
      return { ...state, debouncingLoad: action.debouncingLoad };
    }
    if (isAction(action, DocumentsActionTypes.DOCUMENT_REMOVED)) {
      const newDocs = state.docs ? [...state.docs] : state.docs;
      newDocs?.splice(action.index, 1);
      return {
        ...state,
        docs: newDocs,
        count: state.count === null ? null : state.count - 1,
        end: Math.max(state.end - 1, 0),
      };
    }
    if (isAction(action, DocumentsActionTypes.DOCUMENT_REPLACED)) {
      const newDocs = state.docs ? [...state.docs] : state.docs;
      newDocs?.splice(action.index, 1, action.doc);
      return { ...state, docs: newDocs };
    }
    if (isAction(action, DocumentsActionTypes.DOCS_PER_PAGE_CHANGED)) {
      return { ...state, docsPerPage: action.docsPerPage };
    }
    if (isAction(action, DocumentsActionTypes.SEED_DOCUMENTS_TEST_STATE)) {
      return { ...state, ...action.state };
    }
    return state;
  };
}

function modeForTelemetry(view: string): 'list' | 'json' | 'table' {
  return view.toLowerCase() as 'list' | 'json' | 'table';
}

function findDocumentIndex(docs: Document[] | null, doc: Document) {
  return findIndex(docs ?? [], (d) => doc.getStringId() === d.getStringId());
}

/**
 * Detect if it is safe to perform the count query optimisation where we
 * specify the _id_ index as the hint.
 */
function isCountHintSafe(
  query: { filter?: unknown },
  isTimeSeries: boolean
): boolean {
  if (isTimeSeries) {
    // timeseries collections don't have the _id_ filter, so we can't use the hint speedup
    return false;
  }
  if (query.filter && Object.keys(query.filter).length) {
    // we can't safely use the hint speedup if there's a filter
    return false;
  }
  return true;
}

/**
 * Checks if the initial query was not modified.
 */
function isInitialQuery(query: Query = {}): boolean {
  return (
    isEmpty(query.filter) && isEmpty(query.project) && isEmpty(query.collation)
  );
}

function debounceLoading(
  dispatch: (action: DebouncingLoadChangedAction) => void
) {
  dispatch({
    type: DocumentsActionTypes.DEBOUNCING_LOAD_CHANGED,
    debouncingLoad: true,
  });
  const debouncePromise = new Promise((resolve) => {
    setTimeout(resolve, 200); // 200ms should feel about instant
  });

  let cancelDebounceLoad!: () => void;
  const loadPromise = new Promise<void>((resolve) => {
    cancelDebounceLoad = resolve;
  });

  void Promise.race([debouncePromise, loadPromise]).then(() => {
    dispatch({
      type: DocumentsActionTypes.DEBOUNCING_LOAD_CHANGED,
      debouncingLoad: false,
    });
  });

  return cancelDebounceLoad;
}

async function _verifyUpdateAllowed(
  dataService: {
    getCSFLEMode?: () => string;
    isUpdateAllowed?: (...args: any[]) => Promise<boolean>;
  },
  ns: string,
  doc: Document
): Promise<boolean> {
  if (dataService.getCSFLEMode?.() === 'enabled') {
    const isAllowed = await dataService.isUpdateAllowed?.(
      ns,
      doc.generateOriginalObject()
    );
    if (!isAllowed) {
      doc.onUpdateError(
        new Error(
          'Update blocked as it could unintentionally write unencrypted data due to a missing or incomplete schema.'
        )
      );
      return false;
    }
  }
  return true;
}

export function refreshDocuments(
  onApply = false
): CrudThunkAction<Promise<void>, DocumentsActions> {
  return async (
    dispatch,
    getState,
    {
      dataService,
      preferences,
      logger,
      track,
      connectionInfoRef,
      connectionScopedAppRegistry,
      fieldStoreService,
      queryBar,
      crudOptions,
    }
  ) => {
    if (dataService && !dataService.isConnected()) {
      logger.log.warn(
        mongoLogId(1_001_000_072),
        'Documents',
        'Trying to refresh documents but dataService is disconnected'
      );
      return;
    }

    const state = getState();
    const { ns, status, docsPerPage } = state.documents;
    const query = queryBar.getLastAppliedQuery('crud');

    if (status === DOCUMENTS_STATUS_FETCHING) {
      return;
    }

    if (onApply) {
      const { isTimeSeries, isReadonly } = state.collectionMeta;
      const { defaultSortOrder } = preferences.getPreferences();
      track(
        'Query Executed',
        {
          has_filter: !!query.filter && Object.keys(query.filter).length > 0,
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
          mode: modeForTelemetry(state.view.view),
        },
        connectionInfoRef.current
      );
    }

    // pass the signal so that the queries can close their own cursors and
    // reject their promises
    const abortController = new AbortController();
    const signal = abortController.signal;

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

    if (
      !countOptions.hint &&
      isCountHintSafe(query, state.collectionMeta.isTimeSeries)
    ) {
      countOptions.hint = '_id_';
    }

    const isView = crudOptions.isReadonly && crudOptions.sourceName;
    // Default sort options that we allow to choose from in settings will have a
    // massive negative effect on the query performance for views and view-like
    // collections in all cases. To avoid that, we're not applying default sort
    // for those
    const allowDefaultSort = !isView && !crudOptions.isTimeSeries;

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

    // only set limit if it's > 0, read-only views cannot handle 0 limit.
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

    // Only check if index was used if query filter or sort is not empty
    if (!isEmpty(query.filter) || !isEmpty(query.sort)) {
      void dataService
        .explainFind(ns, query.filter ?? {}, findOptions, {
          explainVerbosity: 'queryPlanner',
          abortSignal: signal,
        })
        .then((rawExplainPlan) => {
          const explainPlan = new ExplainPlan(rawExplainPlan as Stage);
          dispatch({
            type: DocumentsActionTypes.COLLECTION_SCAN_RESULT,
            isCollectionScan: explainPlan.isCollectionScan,
          });
        })
        .catch(() => {
          // We are only fetching this to get information about index usage for
          // insight badge, if this fails for any reason, server, cancel, or
          // error parsing explain, we don't care and ignore it
        });
    } else {
      dispatch({
        type: DocumentsActionTypes.COLLECTION_SCAN_RESULT,
        isCollectionScan: false,
      });
    }

    // Don't wait for the count to finish. Set the result asynchronously.
    void countDocuments(
      dataService,
      preferences,
      ns,
      query.filter ?? {},
      countOptions,
      (err: any) => {
        logger.log.warn(
          mongoLogId(1_001_000_288),
          'Documents',
          'Failed to count documents',
          err
        );
      }
    )
      .then((count) => {
        dispatch({
          type: DocumentsActionTypes.COUNT_FETCHED,
          count,
        });
      })
      .catch((err) => {
        // countDocuments already swallows all db errors and returns null. The
        // only known error it can throw is AbortError. If
        // something new does appear we probably shouldn't swallow it.
        if (!dataService.isCancelError(err)) {
          throw err;
        }
        dispatch({ type: DocumentsActionTypes.COUNT_FINISHED });
      });

    const promises = [
      fetchShardingKeys(
        dataService,
        ns,
        fetchShardingKeysOptions,
        (err: Error) => {
          logger.log.warn(
            mongoLogId(1_001_000_075),
            'Documents',
            'Failed to fetch sharding keys',
            err
          );
        }
      ),
      fetchDocuments(
        dataService,
        track,
        state.collectionMeta.version,
        state.collectionMeta.isDataLake,
        ns,
        query.filter ?? {},
        findOptions,
        {
          abortSignal: signal,
        }
      ),
    ] as const;

    dispatch({
      type: DocumentsActionTypes.REFRESH_STARTED,
      abortController,
      lastCountRunMaxTimeMS: countOptions.maxTimeMS!,
    });

    // don't start showing the loading indicator and cancel button immediately
    const cancelDebounceLoad = debounceLoading(dispatch);

    try {
      const [shardKeys, docs] = await Promise.all(promises);
      dispatch({
        type: DocumentsActionTypes.REFRESH_SUCCESS,
        docs,
        shardKeys,
        status: isInitialQuery(query)
          ? DOCUMENTS_STATUS_FETCHED_INITIAL
          : DOCUMENTS_STATUS_FETCHED_CUSTOM,
      });

      void fieldStoreService.updateFieldsFromDocuments(ns, [
        docs[0]?.generateObject(),
      ]);

      // Notify the instance store to refresh collection stats so the tab
      // header count stays in sync with the pagination count.
      connectionScopedAppRegistry.emit('documents-refreshed', { ns });
    } catch (error) {
      logger.log.error(
        mongoLogId(1_001_000_074),
        'Documents',
        'Failed to refresh documents',
        error
      );
      dispatch({
        type: DocumentsActionTypes.REFRESH_ERROR,
        error: error as Error,
      });
    }

    cancelDebounceLoad();
  };
}

export function getPage(
  page: number
): CrudThunkAction<Promise<void>, DocumentsActions> {
  return async (
    dispatch,
    getState,
    { dataService, preferences, track, fieldStoreService, queryBar }
  ) => {
    const state = getState();
    const { ns, status, docsPerPage } = state.documents;

    if (page < 0) return;
    if (status === DOCUMENTS_STATUS_FETCHING) return;

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
      if (remaining < 1) return;
      if (remaining < nextPageCount) nextPageCount = remaining;
    }

    const abortController = new AbortController();
    const signal = abortController.signal;

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

    dispatch({
      type: DocumentsActionTypes.GET_PAGE_STARTED,
      abortController,
    });

    const cancelDebounceLoad = debounceLoading(dispatch);

    let documents: HadronDocument[];
    try {
      documents = await fetchDocuments(
        dataService,
        track,
        state.collectionMeta.version,
        state.collectionMeta.isDataLake,
        ns,
        filter ?? {},
        opts,
        { abortSignal: signal }
      );
    } catch (error) {
      dispatch({
        type: DocumentsActionTypes.GET_PAGE_ERROR,
        error: error as Error,
        page,
        start: 0,
        end: skip,
      });
      cancelDebounceLoad();
      return;
    }

    const length = documents.length;
    dispatch({
      type: DocumentsActionTypes.GET_PAGE_SUCCESS,
      docs: documents,
      // making sure we don't set start to 1 if length is 0
      start: length === 0 ? 0 : skip + 1,
      end: skip + length,
      page,
    });
    void fieldStoreService.updateFieldsFromDocuments(ns, [
      documents[0]?.generateObject(),
    ]);

    cancelDebounceLoad();
  };
}

export function cancelOperation(): CrudThunkAction<
  void,
  CancelOperationAction
> {
  return (dispatch, getState) => {
    getState().documents.abortController?.abort(
      new Error('This operation was aborted')
    );
    dispatch({ type: DocumentsActionTypes.CANCEL_OPERATION });
  };
}

export function removeDocument(
  doc: Document
): CrudThunkAction<Promise<void>, DocumentsActions> {
  return async (
    dispatch,
    getState,
    {
      dataService,
      localAppRegistry,
      connectionScopedAppRegistry,
      track,
      connectionInfoRef,
    }
  ) => {
    track(
      'Document Deleted',
      { mode: modeForTelemetry(getState().view.view) },
      connectionInfoRef.current
    );
    const id = doc.getId();
    if (id === undefined) {
      doc.onRemoveError(DELETE_ERROR);
      return;
    }
    doc.onRemoveStart();
    try {
      const ns = getState().documents.ns;
      await dataService.deleteOne(ns, { _id: id as any });
      doc.onRemoveSuccess();
      const payload = { view: getState().view.view, ns };
      localAppRegistry.emit('document-deleted', payload);
      connectionScopedAppRegistry.emit('document-deleted', payload);
      const index = findDocumentIndex(getState().documents.docs, doc);
      dispatch({ type: DocumentsActionTypes.DOCUMENT_REMOVED, index });
    } catch (error) {
      doc.onRemoveError(error as Error);
    }
  };
}

export function updateDocument(
  doc: Document
): CrudThunkAction<Promise<void>, DocumentReplacedAction> {
  return async (
    dispatch,
    getState,
    { dataService, logger, track, connectionInfoRef }
  ) => {
    track(
      'Document Updated',
      { mode: modeForTelemetry(getState().view.view) },
      connectionInfoRef.current
    );
    try {
      doc.onUpdateStart();
      const { query, updateDoc } =
        doc.generateUpdateUnlessChangedInBackgroundQuery({
          alwaysIncludeKeys: Object.keys(
            getState().documents.shardKeys || {}
          ).map((key) => key.split('.')),
        });
      logger.debug('Performing findOneAndUpdate', { query, updateDoc });

      if (Object.keys(updateDoc).length === 0) {
        doc.onUpdateError(EMPTY_UPDATE_ERROR);
        return;
      }

      const ns = getState().documents.ns;
      if (!(await _verifyUpdateAllowed(dataService, ns, doc))) {
        return;
      }
      const [error, d] = await findAndModifyWithFLEFallback(
        dataService,
        ns,
        query,
        updateDoc,
        'update'
      );

      if (error) {
        if (
          error.codeName === 'InvalidPipelineOperator' &&
          error.message.match(/\$[gs]etField/)
        ) {
          const nbsp = ' ';
          error.message += ` (Updating fields whose names contain dots or start with $ require MongoDB${nbsp}5.0 or above.)`;
        }
        doc.onUpdateError(error as Error);
      } else if (d) {
        doc.onUpdateSuccess(d);
        const index = findDocumentIndex(getState().documents.docs, doc);
        dispatch({
          type: DocumentsActionTypes.DOCUMENT_REPLACED,
          index,
          doc: new HadronDocument(d),
        });
      } else {
        doc.onUpdateBlocked();
      }
    } catch (err: any) {
      doc.onUpdateError(
        new Error(
          `An error occured when attempting to update the document: ${String(
            err.message
          )}`
        )
      );
    }
  };
}

export function replaceDocument(
  doc: Document
): CrudThunkAction<Promise<void>, DocumentReplacedAction> {
  return async (
    dispatch,
    getState,
    { dataService, logger, track, connectionInfoRef }
  ) => {
    track(
      'Document Updated',
      { mode: modeForTelemetry(getState().view.view) },
      connectionInfoRef.current
    );
    try {
      doc.onUpdateStart();

      const ns = getState().documents.ns;
      if (!(await _verifyUpdateAllowed(dataService, ns, doc))) {
        return;
      }

      const object = doc.generateObject();
      const queryKeyInclusionOptions: Mutable<
        Parameters<
          typeof doc.getQueryForOriginalKeysAndValuesForSpecifiedKeys
        >[0]
      > = {
        alwaysIncludeKeys: [
          ['_id'],
          // '.' in shard keys means nested doc
          ...Object.keys(getState().documents.shardKeys || {}).map((key) =>
            key.split('.')
          ),
        ],
      };

      if (dataService.getCSFLEMode?.() === 'enabled') {
        const knownSchemaForCollection =
          await dataService.knownSchemaForCollection(ns);

        // The find/query portion will typically exclude encrypted fields,
        // because those cannot be queried to make sure that the original
        // value matches the current one; however, if we know that the
        // field is equality-searchable, we can (and should) still include it.
        queryKeyInclusionOptions.includableEncryptedKeys =
          knownSchemaForCollection.encryptedFields.equalityQueryableEncryptedFields;

        if (
          object.__safeContent__ &&
          isEqualSafeContent(
            object.__safeContent__,
            doc.generateOriginalObject().__safeContent__
          ) &&
          knownSchemaForCollection.hasSchema
        ) {
          // SERVER-66662 blocks writes of __safeContent__ for queryable-encryption-enabled
          // collections. We remove it unless it was edited, in which case we assume that the
          // user really knows what they are doing.
          delete object.__safeContent__;
        }
      }

      const query = doc.getQueryForOriginalKeysAndValuesForSpecifiedKeys(
        queryKeyInclusionOptions
      );
      logger.debug('Performing findOneAndReplace', { query, object });

      const [error, d] = await findAndModifyWithFLEFallback(
        dataService,
        ns,
        query,
        object,
        'replace'
      );
      if (error) {
        doc.onUpdateError(error as Error);
      } else {
        doc.onUpdateSuccess(d);
        const index = findDocumentIndex(getState().documents.docs, doc);
        dispatch({
          type: DocumentsActionTypes.DOCUMENT_REPLACED,
          index,
          doc: new HadronDocument(d),
        });
      }
    } catch (err: any) {
      doc.onUpdateError(
        new Error(
          `An error occured when attempting to update the document: ${String(
            err.message
          )}`
        )
      );
    }
  };
}

function isEqualSafeContent(a: unknown, b: unknown): boolean {
  // Lightweight reference + JSON equality is enough for the safeContent
  // comparison used by replaceDocument. Avoids dragging in lodash isEqual
  // for that single call site.
  if (a === b) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

export function copyToClipboard(doc: Document): CrudThunkAction<void, never> {
  return (dispatch, getState, { track, connectionInfoRef }) => {
    track(
      'Document Copied',
      { mode: modeForTelemetry(getState().view.view) },
      connectionInfoRef.current
    );
    const documentEJSON = doc.toEJSON();
    // eslint-disable-next-line no-undef
    void navigator.clipboard.writeText(documentEJSON);
  };
}

export function updateMaxDocumentsPerPage(
  docsPerPage: number
): CrudThunkAction<void, DocumentsActions> {
  return (dispatch, getState) => {
    const previousDocsPerPage = getState().documents.docsPerPage;
    localStorage.setItem(MAX_DOCS_PER_PAGE_STORAGE_KEY, String(docsPerPage));
    dispatch({
      type: DocumentsActionTypes.DOCS_PER_PAGE_CHANGED,
      docsPerPage,
    });
    if (previousDocsPerPage !== docsPerPage) {
      void dispatch(refreshDocuments());
    }
  };
}

export function openCreateIndexModal(): CrudThunkAction<void, never> {
  return (dispatch, getState, { localAppRegistry, queryBar }) => {
    localAppRegistry.emit('open-create-index-modal', {
      query: EJSON.serialize(queryBar.getLastAppliedQuery('crud')?.filter),
    });
  };
}

export function openCreateSearchIndexModal(): CrudThunkAction<void, never> {
  return (dispatch, getState, { localAppRegistry }) => {
    localAppRegistry.emit('open-create-search-index-modal');
  };
}

export function openImportFileDialog(): CrudThunkAction<void, never> {
  return (dispatch, getState, { connectionScopedAppRegistry }) => {
    connectionScopedAppRegistry.emit('open-import', {
      namespace: getState().documents.ns,
      origin: 'empty-state',
    });
  };
}

export function openExportFileDialog(
  exportFullCollection?: boolean
): CrudThunkAction<void, never> {
  return (dispatch, getState, { connectionScopedAppRegistry, queryBar }) => {
    const { filter, project, collation, limit, skip, sort } =
      queryBar.getLastAppliedQuery('crud');

    connectionScopedAppRegistry.emit('open-export', {
      namespace: getState().documents.ns,
      query: { filter, project, collation, limit, skip, sort },
      exportFullCollection,
      origin: 'crud-toolbar',
    });
  };
}

export function openQueryExportToLanguageDialog(): CrudThunkAction<
  void,
  never
> {
  return (dispatch, getState, { localAppRegistry, queryBar }) => {
    const query = queryBar.getLastAppliedQuery('crud');
    localAppRegistry.emit(
      'open-query-export-to-language',
      {
        filter: toJSString(query.filter) || '{}',
        project: query.project ? toJSString(query.project) : undefined,
        sort: query.sort ? toJSString(query.sort) : undefined,
        collation: query.collation ? toJSString(query.collation) : undefined,
        skip: query.skip ? String(query.skip) : undefined,
        limit: query.limit ? String(query.limit) : undefined,
      },
      'Query'
    );
  };
}

export function openDeleteQueryExportToLanguageDialog(): CrudThunkAction<
  void,
  never
> {
  return (dispatch, getState, { localAppRegistry, queryBar }) => {
    const { filter = {} } = queryBar.getLastAppliedQuery('crud');
    localAppRegistry.emit(
      'open-query-export-to-language',
      {
        filter: toJSString(filter) || '{}',
      },
      'Delete Query'
    );
  };
}
