import { cloneDeep, isEqual, pick } from 'lodash';
import type { IndexDefinition } from 'mongodb-data-service';
import type { AnyAction } from 'redux';
import {
  openToast,
  showConfirmation as showConfirmationModal,
} from '@mongodb-js/compass-components';

import { FetchStatuses, NOT_FETCHABLE_STATUSES } from '../utils/fetch-status';
import type { FetchStatus } from '../utils/fetch-status';
import { FetchReasons } from '../utils/fetch-reason';
import type { FetchReason } from '../utils/fetch-reason';
import { isAction } from '../utils/is-action';
import type { CreateIndexSpec } from './create-index';
import type { IndexesThunkAction, RootState } from '.';
import {
  hideModalDescription,
  unhideModalDescription,
} from '../utils/modal-descriptions';
import type { CreateIndexesOptions, IndexDirection } from 'mongodb';
import { hasColumnstoreIndex } from '../utils/columnstore-indexes';

export type RegularIndex = Omit<
  IndexDefinition,
  'type' | 'cardinality' | 'properties' | 'version'
> &
  Partial<IndexDefinition>;

export type InProgressIndex = {
  id: string;
  key: CreateIndexSpec;
  fields: { field: string; value: string | number }[];
  name: string;
  ns: string;
  size: number;
  relativeSize: number;
  usageCount: number;
  extra: {
    status: 'inprogress' | 'failed';
    error?: string;
  };
};

const prepareInProgressIndex = (
  id: string,
  {
    ns,
    name,
    spec,
  }: {
    ns: string;
    name?: string;
    spec: CreateIndexSpec;
  }
): InProgressIndex => {
  const inProgressIndexFields = Object.keys(spec).map((field: string) => ({
    field,
    value: spec[field],
  }));
  const inProgressIndexName =
    name ||
    Object.keys(spec).reduce((previousValue, currentValue) => {
      return `${
        previousValue === '' ? '' : `${previousValue}_`
      }${currentValue}_${spec[currentValue]}`;
    }, '');
  return {
    id,
    extra: {
      status: 'inprogress',
    },
    key: spec,
    fields: inProgressIndexFields,
    name: inProgressIndexName,
    ns,
    size: 0,
    relativeSize: 0,
    usageCount: 0,
  };
};

export enum ActionTypes {
  IndexesOpened = 'compass-indexes/regular-indexes/indexes-opened',
  IndexesClosed = 'compass-indexes/regular-indexes/indexes-closed',

  FetchIndexesStarted = 'compass-indexes/regular-indexes/fetch-indexes-started',
  FetchIndexesSucceeded = 'compass-indexes/regular-indexes/fetch-indexes-succeeded',
  FetchIndexesFailed = 'compass-indexes/regular-indexes/fetch-indexes-failed',

  // Basically the same thing as ActionTypes.IndexCreationSucceeded
  // in that it will remove the index, but it is for manually removing the row
  // of an index that failed
  FailedIndexRemoved = 'compass-indexes/regular-indexes/failed-index-removed',

  IndexCreationStarted = 'compass-indexes/create-index/index-creation-started',
  IndexCreationSucceeded = 'compass-indexes/create-index/index-creation-succeeded',
  IndexCreationFailed = 'compass-indexes/create-index/index-creation-failed',
}

type IndexesOpenedAction = {
  type: ActionTypes.IndexesOpened;
};

type IndexesClosedAction = {
  type: ActionTypes.IndexesClosed;
};

type FetchIndexesStartedAction = {
  type: ActionTypes.FetchIndexesStarted;
  reason: FetchReason;
};

type FetchIndexesSucceededAction = {
  type: ActionTypes.FetchIndexesSucceeded;
  indexes: RegularIndex[];
};

type FetchIndexesFailedAction = {
  type: ActionTypes.FetchIndexesFailed;
  error: string;
};

type IndexCreationStartedAction = {
  type: ActionTypes.IndexCreationStarted;
  inProgressIndex: InProgressIndex;
};

type IndexCreationSucceededAction = {
  type: ActionTypes.IndexCreationSucceeded;
  inProgressIndexId: string;
};

type IndexCreationFailedAction = {
  type: ActionTypes.IndexCreationFailed;
  inProgressIndexId: string;
  error: string;
};

type FailedIndexRemovedAction = {
  type: ActionTypes.FailedIndexRemoved;
  inProgressIndexId: string;
};

export type State = {
  indexes: RegularIndex[];
  status: FetchStatus;
  inProgressIndexes: InProgressIndex[];
  error?: string;
};

export const INITIAL_STATE: State = {
  status: FetchStatuses.NOT_READY,
  indexes: [],
  inProgressIndexes: [],
  error: undefined,
};

export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): State {
  if (isAction<IndexesOpenedAction>(action, ActionTypes.IndexesOpened)) {
    return {
      ...state,
    };
  }

  if (isAction<IndexesClosedAction>(action, ActionTypes.IndexesClosed)) {
    return {
      ...state,
    };
  }

  if (
    isAction<FetchIndexesStartedAction>(action, ActionTypes.FetchIndexesStarted)
  ) {
    return {
      ...state,
      status:
        action.reason === FetchReasons.POLL
          ? FetchStatuses.POLLING
          : action.reason === FetchReasons.REFRESH
          ? FetchStatuses.REFRESHING
          : FetchStatuses.FETCHING,
    };
  }

  if (
    isAction<FetchIndexesSucceededAction>(
      action,
      ActionTypes.FetchIndexesSucceeded
    )
  ) {
    // Merge the newly fetched indexes and the existing in-progress ones.
    const inProgressIndexes = state.inProgressIndexes;
    const allIndexes = _mergeInProgressIndexes(
      action.indexes,
      cloneDeep(inProgressIndexes)
    );

    return {
      ...state,
      indexes: allIndexes,
      status: FetchStatuses.READY,
    };
  }

  if (
    isAction<FetchIndexesFailedAction>(action, ActionTypes.FetchIndexesFailed)
  ) {
    return {
      ...state,
      // We do no set any error on poll or refresh and the
      // previous list of indexes is shown to the user.
      // If fetch fails for refresh or polling, set the status to READY again.
      error:
        state.status === FetchStatuses.FETCHING ? action.error : state.error,
      status:
        state.status === FetchStatuses.FETCHING
          ? FetchStatuses.ERROR
          : FetchStatuses.READY,
    };
  }

  if (
    isAction<IndexCreationStartedAction>(
      action,
      ActionTypes.IndexCreationStarted
    )
  ) {
    // Add the new in-progress index to the in-progress indexes.
    const inProgressIndexes = [
      ...state.inProgressIndexes,
      action.inProgressIndex,
    ];

    // Merge the in-progress indexes into the existing indexes.
    const allIndexes = _mergeInProgressIndexes(
      state.indexes,
      cloneDeep(inProgressIndexes)
    );

    return {
      ...state,
      inProgressIndexes,
      indexes: allIndexes,
    };
  }

  if (
    isAction<IndexCreationSucceededAction>(
      action,
      ActionTypes.IndexCreationSucceeded
    ) ||
    isAction<FailedIndexRemovedAction>(action, ActionTypes.FailedIndexRemoved)
  ) {
    return {
      ...state,
      // NOTE: the index is still in indexes because it would have been merged
      // in there, so it will only be gone from the list once fetchIndexes()
      // is dispatched and finishes.
      inProgressIndexes: state.inProgressIndexes.filter(
        (x) => x.id !== action.inProgressIndexId
      ),
    };
  }

  if (
    isAction<IndexCreationFailedAction>(action, ActionTypes.IndexCreationFailed)
  ) {
    const idx = state.inProgressIndexes.findIndex(
      (x) => x.id === action.inProgressIndexId
    );

    const newInProgressIndexes = state.inProgressIndexes;
    newInProgressIndexes[idx] = {
      ...newInProgressIndexes[idx],
      extra: {
        ...newInProgressIndexes[idx].extra,
        status: 'failed',
        error: action.error,
      },
    };

    // When an inprogress index fails to create, we also have to update it in
    // the state.indexes list to correctly update the UI with error state.
    const newIndexes = _mergeInProgressIndexes(
      state.indexes,
      newInProgressIndexes
    );
    return {
      ...state,
      inProgressIndexes: newInProgressIndexes,
      indexes: newIndexes,
    };
  }

  return state;
}

const fetchIndexesStarted = (
  reason: FetchReason
): FetchIndexesStartedAction => ({
  type: ActionTypes.FetchIndexesStarted,
  reason,
});

const fetchIndexesSucceeded = (
  indexes: RegularIndex[]
): FetchIndexesSucceededAction => ({
  type: ActionTypes.FetchIndexesSucceeded,
  indexes,
});

const fetchIndexesFailed = (error: string): FetchIndexesFailedAction => ({
  type: ActionTypes.FetchIndexesFailed,
  error,
});

type FetchIndexesActions =
  | FetchIndexesStartedAction
  | FetchIndexesSucceededAction
  | FetchIndexesFailedAction;

const collectionStatFields = ['name', 'size'];

function pickCollectionStatFields(state: RootState) {
  return state.regularIndexes.indexes.map((index) =>
    pick(index, collectionStatFields)
  );
}

const fetchIndexes = (
  reason: FetchReason
): IndexesThunkAction<Promise<void>, FetchIndexesActions> => {
  return async (dispatch, getState, { dataService, collection }) => {
    const {
      isReadonlyView,
      namespace,
      regularIndexes: { status },
    } = getState();

    if (isReadonlyView) {
      dispatch(fetchIndexesSucceeded([]));
      return;
    }

    // If we are already fetching indexes, we will wait for that
    if (NOT_FETCHABLE_STATUSES.includes(status)) {
      return;
    }

    try {
      dispatch(fetchIndexesStarted(reason));
      const indexes = await dataService.indexes(namespace);
      const indexesBefore = pickCollectionStatFields(getState());
      dispatch(fetchIndexesSucceeded(indexes));
      const indexesAfter = pickCollectionStatFields(getState());
      if (
        reason !== FetchReasons.INITIAL_FETCH &&
        !isEqual(indexesBefore, indexesAfter)
      ) {
        // This makes sure that when the user or something else triggers a
        // re-fetch for the list of indexes with this action and the total
        // changed, the tab header also gets updated. The check against the
        // total is a bit of an optimisation so that we don't also poll the
        // collection stats.
        collection.fetch({ dataService, force: true }).catch(() => {
          /* ignore */
        });
      }
    } catch (err) {
      dispatch(fetchIndexesFailed((err as Error).message));
    }
  };
};

export const fetchRegularIndexes = (): IndexesThunkAction<
  Promise<void>,
  FetchIndexesActions
> => {
  return async (dispatch) => {
    await dispatch(fetchIndexes(FetchReasons.INITIAL_FETCH));
  };
};

export const refreshRegularIndexes = (): IndexesThunkAction<
  Promise<void>,
  FetchIndexesActions
> => {
  return async (dispatch) => {
    await dispatch(fetchIndexes(FetchReasons.REFRESH));
  };
};

export const pollRegularIndexes = (): IndexesThunkAction<
  Promise<void>,
  FetchIndexesActions
> => {
  return async (dispatch) => {
    return await dispatch(fetchIndexes(FetchReasons.POLL));
  };
};

export const POLLING_INTERVAL = 5000;

const pollIntervalByTabId = new Map<string, ReturnType<typeof setInterval>>();

export const startPollingRegularIndexes = (
  tabId: string
): IndexesThunkAction<void, FetchIndexesActions> => {
  return function (dispatch) {
    if (pollIntervalByTabId.has(tabId)) {
      return;
    }

    pollIntervalByTabId.set(
      tabId,
      setInterval(() => {
        void dispatch(pollRegularIndexes());
      }, POLLING_INTERVAL)
    );
  };
};

export const stopPollingRegularIndexes = (tabId: string) => {
  return () => {
    if (!pollIntervalByTabId.has(tabId)) {
      return;
    }

    clearInterval(pollIntervalByTabId.get(tabId));
    pollIntervalByTabId.delete(tabId);
  };
};

const indexCreationStarted = (
  inProgressIndex: InProgressIndex
): IndexCreationStartedAction => ({
  type: ActionTypes.IndexCreationStarted,
  inProgressIndex,
});

const indexCreationSucceeded = (
  inProgressIndexId: string
): IndexCreationSucceededAction => ({
  type: ActionTypes.IndexCreationSucceeded,
  inProgressIndexId,
});

const indexCreationFailed = (
  inProgressIndexId: string,
  error: string
): IndexCreationFailedAction => ({
  type: ActionTypes.IndexCreationFailed,
  inProgressIndexId,
  error,
});

export function createRegularIndex(
  inProgressIndexId: string,
  spec: Record<string, IndexDirection>,
  options: CreateIndexesOptions,
  isRollingIndexBuild: boolean
): IndexesThunkAction<
  Promise<void>,
  | IndexCreationStartedAction
  | IndexCreationSucceededAction
  | IndexCreationFailedAction
> {
  return async (
    dispatch,
    getState,
    { track, dataService, rollingIndexesService, connectionInfoRef }
  ) => {
    const ns = getState().namespace;
    const inProgressIndex = prepareInProgressIndex(inProgressIndexId, {
      ns,
      name: options.name,
      spec,
    });

    dispatch(indexCreationStarted(inProgressIndex));

    const fieldsFromSpec = Object.entries(spec).map(([k, v]) => {
      return { name: k, type: String(v) };
    });

    const trackEvent = {
      unique: options.unique,
      ttl: typeof options.expireAfterSeconds !== 'undefined',
      columnstore_index: hasColumnstoreIndex(fieldsFromSpec),
      has_columnstore_projection:
        // @ts-expect-error columnstoreProjection is not a part of
        // CreateIndexesOptions yet.
        typeof options.columnstoreProjection !== 'undefined',
      has_wildcard_projection:
        typeof options.wildcardProjection !== 'undefined',
      custom_collation: typeof options.collation !== 'undefined',
      geo: fieldsFromSpec.some(({ type }) => {
        return type === '2dsphere';
      }),
      atlas_search: false,
    };

    try {
      const createFn = isRollingIndexBuild
        ? rollingIndexesService.createRollingIndex.bind(rollingIndexesService)
        : dataService.createIndex.bind(rollingIndexesService);
      await createFn(ns, spec, options);
      dispatch(indexCreationSucceeded(inProgressIndexId));
      track('Index Created', trackEvent, connectionInfoRef.current);

      // Start a new fetch so that the newly added index's details can be
      // loaded. indexCreationSucceeded() will remove the in-progress one, but
      // we still need the new info.
      await dispatch(refreshRegularIndexes());
    } catch (err) {
      dispatch(indexCreationFailed(inProgressIndexId, (err as Error).message));
    }
  };
}

const failedIndexRemoved = (
  inProgressIndexId: string
): FailedIndexRemovedAction => ({
  type: ActionTypes.FailedIndexRemoved,
  inProgressIndexId: inProgressIndexId,
});

// Exporting this for test only to stub it and set
// its value. This enables to test dropIndex action.
export const showConfirmation = showConfirmationModal;

export const dropIndex = (
  indexName: string
): IndexesThunkAction<
  Promise<void>,
  FailedIndexRemovedAction | FetchIndexesActions
> => {
  return async (
    dispatch,
    getState,
    { connectionInfoRef, dataService, track }
  ) => {
    const { namespace, regularIndexes } = getState();
    const { indexes, inProgressIndexes } = regularIndexes;
    const index = indexes.find((x) => x.name === indexName);

    if (!index) {
      return;
    }

    const inProgressIndex = inProgressIndexes.find((x) => x.name === indexName);
    if (inProgressIndex && inProgressIndex.extra.status === 'failed') {
      // This really just removes the (failed) in-progress index
      dispatch(failedIndexRemoved(String(inProgressIndex.id)));

      // By fetching the indexes again we make sure the merged list doesn't have
      // it either.
      await dispatch(fetchIndexes(FetchReasons.REFRESH));
      return;
    }

    try {
      const connectionInfo = connectionInfoRef.current;
      track('Screen', { name: 'drop_index_modal' }, connectionInfo);
      const confirmed = await showConfirmation({
        variant: 'danger',
        title: 'Drop Index',
        description: `Are you sure you want to drop index "${indexName}"?`,
        requiredInputText: indexName,
        buttonText: 'Drop',
        'data-testid': 'drop-index-modal',
      });
      if (!confirmed) {
        return;
      }
      await dataService.dropIndex(namespace, indexName);
      track('Index Dropped', { atlas_search: false }, connectionInfo);
      openToast('drop-index-success', {
        variant: 'success',
        title: `Index "${indexName}" dropped`,
        timeout: 3000,
      });
      await dispatch(fetchIndexes(FetchReasons.REFRESH));
    } catch (err) {
      openToast('drop-index-error', {
        variant: 'important',
        title: `Failed to drop index "${indexName}"`,
        description: (err as Error).message,
        timeout: 3000,
      });
    }
  };
};

export const hideIndex = (
  indexName: string
): IndexesThunkAction<Promise<void>, FetchIndexesActions> => {
  return async (dispatch, getState, { dataService }) => {
    const { namespace } = getState();
    const confirmed = await showConfirmation({
      title: `Hiding \`${indexName}\``,
      description: hideModalDescription(indexName),
    });

    if (!confirmed) {
      return;
    }

    try {
      await dataService.updateCollection(namespace, {
        index: {
          name: indexName,
          hidden: true,
        },
      });
      await dispatch(fetchIndexes(FetchReasons.REFRESH));
    } catch (error) {
      openToast('hide-index-error', {
        title: 'Failed to hide the index',
        variant: 'warning',
        description: `An error occurred while hiding the index. ${
          (error as Error).message
        }`,
      });
    }
  };
};

export const unhideIndex = (
  indexName: string
): IndexesThunkAction<Promise<void>, FetchIndexesActions> => {
  return async (dispatch, getState, { dataService }) => {
    const { namespace } = getState();
    const confirmed = await showConfirmation({
      title: `Unhiding \`${indexName}\``,
      description: unhideModalDescription(indexName),
    });

    if (!confirmed) {
      return;
    }

    try {
      await dataService.updateCollection(namespace, {
        index: {
          name: indexName,
          hidden: false,
        },
      });
      await dispatch(fetchIndexes(FetchReasons.REFRESH));
    } catch (error) {
      openToast('unhide-index-error', {
        title: 'Failed to unhide the index',
        variant: 'warning',
        description: `An error occurred while unhiding the index. ${
          (error as Error).message
        }`,
      });
    }
  };
};

function _mergeInProgressIndexes(
  _indexes: RegularIndex[],
  inProgressIndexes: InProgressIndex[]
) {
  const indexes = cloneDeep(_indexes);

  for (const inProgressIndex of inProgressIndexes) {
    const index = indexes.find((index) => index.name === inProgressIndex.name);

    if (index) {
      index.extra = index.extra ?? {};
      index.extra.status = inProgressIndex.extra.status;
      if (inProgressIndex.extra.error) {
        index.extra.error = inProgressIndex.extra.error;
      }
    } else {
      // in-progress indexes also have ids which regular indexes don't
      const index: RegularIndex = { ...inProgressIndex };
      delete (index as RegularIndex & { id?: any }).id;
      indexes.push(index);
    }
  }

  return indexes;
}
