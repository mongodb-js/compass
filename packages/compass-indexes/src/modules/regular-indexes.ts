import type { IndexDefinition as _IndexDefinition } from 'mongodb-data-service';
import type { AnyAction } from 'redux';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';
import { localAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';
import { openToast, showConfirmation } from '@mongodb-js/compass-components';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { cloneDeep } from 'lodash';

import { isAction } from './../utils/is-action';
import type { CreateIndexSpec } from './create-index';
import type { RootState } from '.';
import {
  hideModalDescription,
  unhideModalDescription,
} from '../utils/modal-descriptions';

const { debug } = createLoggerAndTelemetry('COMPASS-INDEXES');

export type SortColumn = keyof typeof sortColumnToProps;
export type SortDirection = 'asc' | 'desc';
type SortField = keyof Pick<
  IndexDefinition,
  'name' | 'type' | 'size' | 'usageCount' | 'properties'
>;

const sortColumnToProps = {
  'Name and Definition': 'name',
  Type: 'type',
  Size: 'size',
  Usage: 'usageCount',
  Properties: 'properties',
} as const;

export type IndexDefinition = Omit<
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
  IndexesSorted = 'indexes/regular-indexes/IndexesSorted',

  SetIsRefreshing = 'indexes/regular-indexes/SetIsRefreshing',
  SetError = 'indexes/regular-indexes/SetError',

  InProgressIndexAdded = 'indexes/regular-indexes/InProgressIndexAdded',
  InProgressIndexRemoved = 'indexes/regular-indexes/InProgressIndexRemoved',
  InProgressIndexFailed = 'indexes/regular-indexes/InProgressIndexFailed',
}

type IndexesAddedAction = {
  type: ActionTypes.IndexesAdded;
  indexes: IndexDefinition[];
};

type IndexesSortedAction = {
  type: ActionTypes.IndexesSorted;
  indexes: IndexDefinition[];
  sortOrder: SortDirection;
  sortColumn: SortColumn;
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

export type State = {
  indexes: IndexDefinition[];
  sortOrder: SortDirection;
  sortColumn: SortColumn;
  isRefreshing: boolean;
  inProgressIndexes: InProgressIndex[];
  error: string | null;
};

export const INITIAL_STATE: State = {
  indexes: [],
  sortOrder: 'asc',
  sortColumn: 'Name and Definition',
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

  if (isAction<IndexesSortedAction>(action, ActionTypes.IndexesSorted)) {
    return {
      ...state,
      indexes: action.indexes,
      sortOrder: action.sortOrder,
      sortColumn: action.sortColumn,
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

    return {
      ...state,
      inProgressIndexes: newInProgressIndexes,
    };
  }

  return state;
}

export const setIndexes = (indexes: IndexDefinition[]): IndexesAddedAction => ({
  type: ActionTypes.IndexesAdded,
  indexes,
});

const setIsRefreshing = (isRefreshing: boolean): SetIsRefreshingAction => ({
  type: ActionTypes.SetIsRefreshing,
  isRefreshing,
});

export const setError = (error: string | null): SetErrorAction => ({
  type: ActionTypes.SetError,
  error,
});

const _handleIndexesChanged = (
  dispatch: ThunkDispatch<
    RootState,
    void,
    SetIsRefreshingAction | IndexesAddedAction
  >,
  indexes: IndexDefinition[]
) => {
  dispatch(setIndexes(indexes));
  dispatch(setIsRefreshing(false));
  dispatch(localAppRegistryEmit('indexes-changed', indexes));
};

export const fetchIndexes = (): ThunkAction<
  Promise<void>,
  RootState,
  void,
  IndexesAddedAction | SetIsRefreshingAction | SetErrorAction
> => {
  return async (dispatch, getState) => {
    const {
      isReadonlyView,
      dataService,
      namespace,
      regularIndexes: { sortColumn, sortOrder, inProgressIndexes },
    } = getState();

    if (isReadonlyView) {
      return _handleIndexesChanged(dispatch, []);
    }

    if (!dataService || !dataService.isConnected()) {
      dispatch(setIsRefreshing(false));
      debug('warning: trying to load indexes but dataService is disconnected');
      return;
    }

    try {
      dispatch(setError(null));
      const indexes = await dataService.indexes(namespace);
      const allIndexes = _mergeInProgressIndexes(
        indexes,
        cloneDeep(inProgressIndexes) as InProgressIndex[]
      ).sort(_getSortFunction(_mapColumnToProp(sortColumn), sortOrder));

      _handleIndexesChanged(dispatch, allIndexes);
    } catch (err) {
      dispatch(setError((err as Error).message));
      _handleIndexesChanged(dispatch, []);
    }
  };
};

export const sortIndexes = (
  column: SortColumn,
  order: SortDirection
): ThunkAction<void, RootState, void, IndexesSortedAction> => {
  return (dispatch, getState) => {
    const {
      regularIndexes: { indexes },
    } = getState();

    const sortedIndexes = [...indexes].sort(
      _getSortFunction(_mapColumnToProp(column), order)
    );

    dispatch({
      type: ActionTypes.IndexesSorted,
      indexes: sortedIndexes,
      sortOrder: order,
      sortColumn: column,
    });
  };
};

export const refreshIndexes = (): ThunkAction<
  void,
  RootState,
  void,
  AnyAction
> => {
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

export const dropFailedIndex = (
  id: string
): ThunkAction<void, RootState, void, AnyAction> => {
  return (dispatch) => {
    dispatch(inProgressIndexRemoved(id));
    void dispatch(fetchIndexes());
  };
};

export const hideIndex = (
  indexName: string
): ThunkAction<Promise<void>, RootState, void, AnyAction> => {
  return async (dispatch, getState) => {
    const { dataService, namespace } = getState();
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
): ThunkAction<Promise<void>, RootState, void, AnyAction> => {
  return async (dispatch, getState) => {
    const { namespace, dataService } = getState();
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
  _indexes: IndexDefinition[],
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

const _getSortFunctionForProperties = (order: 1 | -1) => {
  return function (a: IndexDefinition, b: IndexDefinition) {
    const aValue =
      a.cardinality === 'compound' ? 'compound' : a.properties?.[0] || '';
    const bValue =
      b.cardinality === 'compound' ? 'compound' : b.properties?.[0] || '';
    if (aValue > bValue) {
      return order;
    }
    if (aValue < bValue) {
      return -order;
    }
    return 0;
  };
};

const _getSortFunction = (field: SortField, sortOrder: SortDirection) => {
  const order = sortOrder === 'asc' ? 1 : -1;
  if (field === 'properties') {
    return _getSortFunctionForProperties(order);
  }
  return function (a: IndexDefinition, b: IndexDefinition) {
    if (typeof b[field] === 'undefined') {
      return order;
    }
    if (typeof a[field] === 'undefined') {
      return -order;
    }
    if (a[field]! > b[field]!) {
      return order;
    }
    if (a[field]! < b[field]!) {
      return -order;
    }
    return 0;
  };
};

const _mapColumnToProp = (column: SortColumn): SortField => {
  return sortColumnToProps[column];
};
