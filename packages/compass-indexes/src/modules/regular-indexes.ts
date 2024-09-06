import type { IndexDefinition as _IndexDefinition } from 'mongodb-data-service';
import type { AnyAction } from 'redux';
import { openToast, showConfirmation } from '@mongodb-js/compass-components';
import { cloneDeep } from 'lodash';

import { isAction } from './../utils/is-action';
import type { CreateIndexSpec } from './create-index';
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
  IndexesAdded = 'indexes/regular-indexes/IndexesAdded',

  SetIsRefreshing = 'indexes/regular-indexes/SetIsRefreshing',
  SetError = 'indexes/regular-indexes/SetError',

  InProgressIndexAdded = 'indexes/regular-indexes/InProgressIndexAdded',
  InProgressIndexRemoved = 'indexes/regular-indexes/InProgressIndexRemoved',
  InProgressIndexFailed = 'indexes/regular-indexes/InProgressIndexFailed',
}

type IndexesAddedAction = {
  type: ActionTypes.IndexesAdded;
  indexes: RegularIndex[];
};

type SetIsRefreshingAction = {
  type: ActionTypes.SetIsRefreshing;
  isRefreshing: boolean;
};

type SetErrorAction = {
  type: ActionTypes.SetError;
  error: string | null;
};

type InProgressIndexAddedAction = {
  type: ActionTypes.InProgressIndexAdded;
  index: InProgressIndex;
};

type InProgressIndexRemovedAction = {
  type: ActionTypes.InProgressIndexRemoved;
  id: string;
};

type InProgressIndexFailedAction = {
  type: ActionTypes.InProgressIndexFailed;
  id: string;
  error: string;
};

type RegularIndexesActions =
  | IndexesAddedAction
  | SetIsRefreshingAction
  | SetErrorAction
  | InProgressIndexAddedAction
  | InProgressIndexRemovedAction
  | InProgressIndexFailedAction;

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
  if (isAction<IndexesAddedAction>(action, ActionTypes.IndexesAdded)) {
    return {
      ...state,
      indexes: action.indexes,
    };
  }

  if (isAction<SetIsRefreshingAction>(action, ActionTypes.SetIsRefreshing)) {
    return {
      ...state,
      isRefreshing: action.isRefreshing,
    };
  }

  if (isAction<SetErrorAction>(action, ActionTypes.SetError)) {
    return {
      ...state,
      error: action.error,
    };
  }

  if (
    isAction<InProgressIndexAddedAction>(
      action,
      ActionTypes.InProgressIndexAdded
    )
  ) {
    return {
      ...state,
      inProgressIndexes: [...state.inProgressIndexes, action.index],
    };
  }

  if (
    isAction<InProgressIndexRemovedAction>(
      action,
      ActionTypes.InProgressIndexRemoved
    )
  ) {
    return {
      ...state,
      inProgressIndexes: state.inProgressIndexes.filter(
        (x) => x.id !== action.id
      ),
    };
  }

  if (
    isAction<InProgressIndexFailedAction>(
      action,
      ActionTypes.InProgressIndexFailed
    )
  ) {
    const idx = state.inProgressIndexes.findIndex((x) => x.id === action.id);

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

export const setRegularIndexes = (
  indexes: RegularIndex[]
): IndexesAddedAction => ({
  type: ActionTypes.IndexesAdded,
  indexes,
});

const setIsRefreshing = (isRefreshing: boolean): SetIsRefreshingAction => ({
  type: ActionTypes.SetIsRefreshing,
  isRefreshing,
});

const setError = (error: string | null): SetErrorAction => ({
  type: ActionTypes.SetError,
  error,
});

const _handleIndexesChanged = (
  indexes: RegularIndex[]
): IndexesThunkAction<void> => {
  return (dispatch, _, { localAppRegistry }) => {
    dispatch(setRegularIndexes(indexes));
    dispatch(setIsRefreshing(false));
    localAppRegistry?.emit('indexes-changed', indexes);
  };
};

export const fetchIndexes = (): IndexesThunkAction<
  Promise<void>,
  RegularIndexesActions
> => {
  return async (dispatch, getState, { dataService }) => {
    const {
      isReadonlyView,
      namespace,
      regularIndexes: { inProgressIndexes },
    } = getState();

    if (isReadonlyView) {
      dispatch(_handleIndexesChanged([]));
      return;
    }

    try {
      dispatch(setError(null));
      const indexes = await dataService.indexes(namespace);
      const allIndexes = _mergeInProgressIndexes(
        indexes,
        cloneDeep(inProgressIndexes)
      );
      dispatch(_handleIndexesChanged(allIndexes));
    } catch (err) {
      dispatch(setError((err as Error).message));
      dispatch(_handleIndexesChanged([]));
    }
  };
};

export const refreshRegularIndexes = (): IndexesThunkAction<void> => {
  return (dispatch) => {
    dispatch(setIsRefreshing(true));
    void dispatch(fetchIndexes());
  };
};

export const inProgressIndexAdded = (
  inProgressIndex: InProgressIndex
): InProgressIndexAddedAction => ({
  type: ActionTypes.InProgressIndexAdded,
  index: inProgressIndex,
});

export const inProgressIndexRemoved = (
  inProgressIndexId: string
): InProgressIndexRemovedAction => ({
  type: ActionTypes.InProgressIndexRemoved,
  id: inProgressIndexId,
});

export const inProgressIndexFailed = ({
  inProgressIndexId,
  error,
}: {
  inProgressIndexId: string;
  error: string;
}): InProgressIndexFailedAction => ({
  type: ActionTypes.InProgressIndexFailed,
  id: inProgressIndexId,
  error,
});

export const dropIndex = (name: string): IndexesThunkAction<void> => {
  return (dispatch, getState, { localAppRegistry }) => {
    const { indexes } = getState().regularIndexes;
    const index = indexes.find((x) => x.name === name);

    if (!index) {
      return;
    }

    if (index.extra.status === 'failed') {
      dispatch(inProgressIndexRemoved(String((index as InProgressIndex).id)));
      void dispatch(fetchIndexes());
      return;
    }

    localAppRegistry?.emit('open-drop-index-modal', index.name);
  };
};

export const showCreateModal = (): IndexesThunkAction<void> => {
  return (_dispatch, _getState, { localAppRegistry }) => {
    localAppRegistry?.emit('open-create-index-modal');
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
      await dataService?.updateCollection(namespace, {
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
      await dataService?.updateCollection(namespace, {
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
