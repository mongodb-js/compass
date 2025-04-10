import { isEqual, pick } from 'lodash';
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
import type { AtlasIndexStats } from './rolling-indexes-service';
import { connectionSupports } from '@mongodb-js/compass-connections';

export type RegularIndex = Partial<IndexDefinition> &
  Pick<
    IndexDefinition,
    // These are the only ones we're treating as required because they are the
    // ones we use. Everything else is treated as optional.
    | 'name'
    | 'type'
    | 'cardinality'
    | 'properties'
    | 'fields'
    | 'extra'
    | 'size'
    | 'relativeSize'
    | 'usageCount'
  >;

export type InProgressIndex = Pick<IndexDefinition, 'name' | 'fields'> & {
  id: string;
  status: 'inprogress' | 'failed';
  error?: string;
};

export type RollingIndex = Partial<AtlasIndexStats> &
  Pick<
    AtlasIndexStats,
    // These are the only ones we're treating as required because they are the
    // ones we use. Everything else is treated as optional.
    'indexName' | 'indexType' | 'keys'
  >;

/**
 * @internal exported only for testing
 */
export const prepareInProgressIndex = (
  id: string,
  {
    name,
    spec,
  }: {
    name?: string;
    spec: CreateIndexSpec;
  }
): InProgressIndex => {
  const inProgressIndexFields = Object.entries(spec).map(([field, value]) => ({
    field,
    value,
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
    // TODO(COMPASS-8335): we need the type because it shows in the table
    // TODO(COMPASS-8335): the table can also use cardinality
    status: 'inprogress',
    fields: inProgressIndexFields,
    name: inProgressIndexName,
    // TODO(COMPASS-8335): we never mapped properties and the table does have
    // room to display them
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

  // Special case event that happens on a timeout when rolling index is created.
  //
  // Rolling indexes API doesn't allow us to consistently track whether or not
  // creation process failed. This means that in some very rare cases, when
  // creating a job to create a rolling index succeeds, but the actual creation
  // fails before the index ever shows up in the polled list of indexes, we can
  // end up with a stuck "in progress" index. For cases like this we will just
  // check whether or not index is still in progress after a few polls and
  // remove the in progress index from the list.
  RollingIndexTimeoutCheck = 'compass-indexes/create-index/rolling-index-timeout-check',
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
  rollingIndexes?: RollingIndex[];
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

type RollingIndexTimeoutCheckAction = {
  type: ActionTypes.RollingIndexTimeoutCheck;
  indexId: string;
};

export type State = {
  status: FetchStatus;
  indexes: RegularIndex[];
  inProgressIndexes: InProgressIndex[];
  rollingIndexes?: RollingIndex[];
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
    return state;
  }

  if (isAction<IndexesClosedAction>(action, ActionTypes.IndexesClosed)) {
    return state;
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
    const allIndexNames = new Set(
      action.indexes
        .map((index) => {
          return index.name;
        })
        .concat(
          (action.rollingIndexes ?? []).map((index) => {
            return index.indexName;
          })
        )
    );
    return {
      ...state,
      indexes: action.indexes,
      rollingIndexes: action.rollingIndexes,
      // Remove in progress stubs when we got the "real" indexes from one of the
      // backends. Keep the error ones around even if the name matches (should
      // only be possible in cases of "index with the same name already exists")
      inProgressIndexes: state.inProgressIndexes.filter((inProgress) => {
        return !!inProgress.error || !allIndexNames.has(inProgress.name);
      }),
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

    return {
      ...state,
      inProgressIndexes,
    };
  }

  if (
    isAction<FailedIndexRemovedAction>(action, ActionTypes.FailedIndexRemoved)
  ) {
    return {
      ...state,
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
      status: 'failed',
      error: action.error,
    };

    return {
      ...state,
      inProgressIndexes: newInProgressIndexes,
    };
  }

  if (
    isAction<RollingIndexTimeoutCheckAction>(
      action,
      ActionTypes.RollingIndexTimeoutCheck
    )
  ) {
    const newInProgressIndexes = state.inProgressIndexes.filter((index) => {
      return index.id !== action.indexId;
    });

    // Nothing was removed, return the previous state to avoid updates
    if (newInProgressIndexes.length === state.inProgressIndexes.length) {
      return state;
    }

    return {
      ...state,
      inProgressIndexes: newInProgressIndexes,
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
  indexes: RegularIndex[],
  rollingIndexes?: RollingIndex[]
): FetchIndexesSucceededAction => ({
  type: ActionTypes.FetchIndexesSucceeded,
  indexes,
  rollingIndexes,
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
  return async (
    dispatch,
    getState,
    {
      dataService,
      collection,
      connectionInfoRef,
      rollingIndexesService,
      preferences,
    }
  ) => {
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

    const clusterSupportsRollingIndexes = connectionSupports(
      connectionInfoRef.current,
      'rollingIndexCreation'
    );
    const rollingIndexesEnabled =
      !!preferences.getPreferences().enableRollingIndexes;

    const shouldFetchRollingIndexes =
      clusterSupportsRollingIndexes && rollingIndexesEnabled;

    try {
      dispatch(fetchIndexesStarted(reason));
      const promises = [
        dataService.indexes(namespace),
        shouldFetchRollingIndexes
          ? rollingIndexesService.listRollingIndexes(namespace)
          : undefined,
      ] as [Promise<IndexDefinition[]>, Promise<AtlasIndexStats[]> | undefined];
      const [indexes, rollingIndexes] = await Promise.all(promises);
      const indexesBefore = pickCollectionStatFields(getState());
      dispatch(fetchIndexesSucceeded(indexes, rollingIndexes));
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

export const startPollingRegularIndexes = (): IndexesThunkAction<
  void,
  FetchIndexesActions
> => {
  return function (dispatch, _getState, { pollingIntervalRef }) {
    if (pollingIntervalRef.regularIndexes !== null) {
      return;
    }
    pollingIntervalRef.regularIndexes = setInterval(() => {
      void dispatch(pollRegularIndexes());
    }, POLLING_INTERVAL);
  };
};

export const stopPollingRegularIndexes = (): IndexesThunkAction<
  void,
  never
> => {
  return (_dispatch, _getState, { pollingIntervalRef }) => {
    if (pollingIntervalRef.regularIndexes === null) {
      return;
    }
    clearInterval(pollingIntervalRef.regularIndexes);
    pollingIntervalRef.regularIndexes = null;
  };
};

/**
 * @internal exported only for testing
 */
export const indexCreationStarted = (
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

/**
 * @internal exported only for testing
 */
export const rollingIndexTimeoutCheck = (
  indexId: string
): RollingIndexTimeoutCheckAction => {
  return {
    type: ActionTypes.RollingIndexTimeoutCheck,
    indexId,
  };
};

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
  | RollingIndexTimeoutCheckAction
> {
  return async (
    dispatch,
    getState,
    { track, dataService, rollingIndexesService, connectionInfoRef }
  ) => {
    const ns = getState().namespace;
    const inProgressIndex = prepareInProgressIndex(inProgressIndexId, {
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
        : dataService.createIndex.bind(dataService);
      await createFn(ns, spec, options);
      dispatch(indexCreationSucceeded(inProgressIndexId));
      track('Index Created', trackEvent, connectionInfoRef.current);
      // See action description for details
      if (isRollingIndexBuild) {
        setTimeout(() => {
          dispatch(rollingIndexTimeoutCheck(inProgressIndexId));
        }, POLLING_INTERVAL * 3).unref?.();
      }
      // Start a new fetch so that the newly added index's details can be
      // loaded. indexCreationSucceeded() will remove the in-progress one, but
      // we still need the new info.
      await dispatch(refreshRegularIndexes());
    } catch (err) {
      dispatch(indexCreationFailed(inProgressIndexId, (err as Error).message));
      track('Index Create Failed', trackEvent, connectionInfoRef.current);
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

export const dropFailedIndex = (
  indexName: string
): IndexesThunkAction<void, FailedIndexRemovedAction> => {
  return (dispatch, getState) => {
    const { regularIndexes } = getState();
    const { inProgressIndexes } = regularIndexes;

    const inProgressIndex = inProgressIndexes.find((x) => x.name === indexName);
    if (inProgressIndex && inProgressIndex.status === 'failed') {
      // This really just removes the (failed) in-progress index
      dispatch(failedIndexRemoved(String(inProgressIndex.id)));
    }
  };
};

export const dropIndex = (
  indexName: string
): IndexesThunkAction<Promise<void>, FetchIndexesActions> => {
  return async (
    dispatch,
    getState,
    { connectionInfoRef, dataService, track }
  ) => {
    const { namespace, regularIndexes } = getState();
    const { indexes } = regularIndexes;

    const index = indexes.find((x) => x.name === indexName);
    if (!index) {
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
