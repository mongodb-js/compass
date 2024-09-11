import type { IndexDefinition as _IndexDefinition } from 'mongodb-data-service';
import type { AnyAction } from 'redux';
import { openToast, showConfirmation } from '@mongodb-js/compass-components';
import { cloneDeep } from 'lodash';

import { isAction } from './../utils/is-action';
import { ActionTypes as CreateIndexActionTypes } from './create-index';
import type {
  CreateIndexSpec,
  IndexCreationStartedAction,
  IndexCreationSucceededAction,
  IndexCreationFailedAction,
} from './create-index';
import type { IndexesThunkAction } from '.';
import {
  hideModalDescription,
  unhideModalDescription,
} from '../utils/modal-descriptions';

export type RegularIndex = Omit<
  _IndexDefinition,
  'type' | 'cardinality' | 'properties' | 'version'
> &
  Partial<_IndexDefinition>;

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

export enum ActionTypes {
  FetchIndexesStarted = 'compass-indexes/regular-indexes/fetch-indexes-started',
  FetchIndexesSucceeded = 'compass-indexes/regular-indexes/fetch-indexes-succeeded',
  FetchIndexesFailed = 'compass-indexes/regular-indexes/fetch-indexes-failed',

  // Basically the same thing as CreateIndexActionTypes.IndexCreationSucceeded
  // in that it will remove the index, but it is for manually removing the row
  // of an index that failed
  FailedIndexRemoved = 'compass-indexes/regular-indexes/failed-index-removed',
}

type FetchIndexesStartedAction = {
  type: ActionTypes.FetchIndexesStarted;
  isRefreshing: boolean;
};

type FetchIndexesSucceededAction = {
  type: ActionTypes.FetchIndexesSucceeded;
  indexes: RegularIndex[];
};

type FetchIndexesFailedAction = {
  type: ActionTypes.FetchIndexesFailed;
  error: string;
};

type FailedIndexRemovedAction = {
  type: ActionTypes.FailedIndexRemoved;
  inProgressIndexId: string;
};

export type State = {
  indexes: RegularIndex[];
  isRefreshing: boolean;
  inProgressIndexes: InProgressIndex[];
  error: string | null;
};

export const INITIAL_STATE: State = {
  indexes: [],
  inProgressIndexes: [],
  isRefreshing: false,
  error: null,
};

export default function reducer(state = INITIAL_STATE, action: AnyAction) {
  if (
    isAction<FetchIndexesStartedAction>(action, ActionTypes.FetchIndexesStarted)
  ) {
    return {
      ...state,
      error: null,
      isRefreshing: action.isRefreshing,
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
      isRefreshing: false,
    };
  }

  if (
    isAction<FetchIndexesFailedAction>(action, ActionTypes.FetchIndexesFailed)
  ) {
    return {
      ...state,
      error: action.error,
      indexes: [],
      isRefreshing: false,
    };
  }

  if (
    isAction<IndexCreationStartedAction>(
      action,
      CreateIndexActionTypes.IndexCreationStarted
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
      CreateIndexActionTypes.IndexCreationSucceeded
    ) ||
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
    isAction<IndexCreationFailedAction>(
      action,
      CreateIndexActionTypes.IndexCreationFailed
    )
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
  isRefreshing: boolean
): FetchIndexesStartedAction => ({
  type: ActionTypes.FetchIndexesStarted,
  isRefreshing,
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

export const fetchIndexes = (
  isRefreshing = false
): IndexesThunkAction<Promise<void>> => {
  return async (dispatch, getState, { dataService, localAppRegistry }) => {
    const { isReadonlyView, namespace } = getState();

    if (isReadonlyView) {
      dispatch(fetchIndexesSucceeded([]));
      return;
    }

    try {
      dispatch(fetchIndexesStarted(isRefreshing));
      // The number in the header could go up or down whenever an index is added
      // or removed.
      localAppRegistry.emit('refresh-collection-stats');
      const indexes = await dataService.indexes(namespace);
      dispatch(fetchIndexesSucceeded(indexes));
    } catch (err) {
      dispatch(fetchIndexesFailed((err as Error).message));
    }
  };
};

export const refreshRegularIndexes = (): IndexesThunkAction<void> => {
  return (dispatch) => {
    void dispatch(fetchIndexes(true));
  };
};

export const failedIndexRemoved = (
  inProgressIndexId: string
): FailedIndexRemovedAction => ({
  type: ActionTypes.FailedIndexRemoved,
  inProgressIndexId: inProgressIndexId,
});

export const dropIndex = (
  indexName: string
): IndexesThunkAction<Promise<void>> => {
  return async (
    dispatch,
    getState,
    { connectionInfoAccess, dataService, track }
  ) => {
    const { namespace, regularIndexes } = getState();
    const { indexes } = regularIndexes;
    const index = indexes.find((x) => x.name === indexName);

    if (!index) {
      return;
    }

    if (index.extra.status === 'failed') {
      // This really just removes the (failed) in-progress index
      dispatch(failedIndexRemoved(String((index as InProgressIndex).id)));
      void dispatch(fetchIndexes());
      return;
    }

    try {
      const connectionInfo = connectionInfoAccess.getCurrentConnectionInfo();
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
      void dispatch(fetchIndexes(true));
      openToast('drop-index-success', {
        variant: 'success',
        title: `Index "${indexName}" dropped`,
        timeout: 3000,
      });
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
): IndexesThunkAction<Promise<void>> => {
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
      void dispatch(fetchIndexes());
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
): IndexesThunkAction<Promise<void>> => {
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
      void dispatch(fetchIndexes());
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
      indexes.push(inProgressIndex);
    }
  }

  return indexes;
}
