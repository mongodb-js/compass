import { localAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';
import type { IndexDefinition as _IndexDefinition } from 'mongodb-data-service';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';
import _debug from 'debug';
import cloneDeep from 'lodash.clonedeep';
import type { AnyAction } from 'redux';

import type { RootState } from './index';
import { handleError } from './error';
import type { HandleErrorAction, IndexesError } from './error';
import { ActionTypes as RefreshActionTypes } from './is-refreshing';
import type { RefreshFinishedAction } from './is-refreshing';
import type { InProgressIndex } from '../modules/in-progress-indexes';
import { inProgressIndexRemoved } from '../modules/in-progress-indexes';

const debug = _debug('mongodb-compass:modules:indexes');

type SortField = keyof Pick<
  IndexDefinition,
  'name' | 'type' | 'size' | 'usageCount' | 'properties'
>;

export type SortColumn = keyof typeof sortColumnToProps;

export type SortDirection = 'asc' | 'desc';

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

export type IndexFieldsDefinition = _IndexDefinition['fields'];

export enum ActionTypes {
  LoadIndexes = 'indexes/indexes/LOAD_INDEXES',
  SortIndexes = 'indexes/indexes/SORT_INDEXES',
}

type LoadIndexesAction = {
  type: ActionTypes.LoadIndexes;
  indexes: IndexDefinition[];
};

export type SortIndexesAction = {
  type: ActionTypes.SortIndexes;
  indexes: IndexDefinition[];
  column: SortColumn;
  order: SortDirection;
};

type Actions = LoadIndexesAction | SortIndexesAction;
type State = IndexDefinition[];

export const INITIAL_STATE: State = [];

export default function reducer(state: State = INITIAL_STATE, action: Actions) {
  if (action.type === ActionTypes.SortIndexes) {
    return [...action.indexes].sort(
      _getSortFunction(_mapColumnToProp(action.column), action.order)
    );
  }
  if (action.type === ActionTypes.LoadIndexes) {
    return action.indexes;
  }
  return state;
}

export const loadIndexes = (indexes: IndexDefinition[]): LoadIndexesAction => ({
  type: ActionTypes.LoadIndexes,
  indexes,
});

export const sortIndexes = (
  column: SortColumn,
  order: SortDirection
): ThunkAction<void, RootState, void, SortIndexesAction> => {
  return (dispatch, getState) => {
    const { indexes } = getState();
    dispatch({
      type: ActionTypes.SortIndexes,
      indexes,
      column,
      order,
    });
  };
};

const _handleIndexesChanged = (
  dispatch: ThunkDispatch<
    RootState,
    void,
    RefreshFinishedAction | LoadIndexesAction
  >,
  indexes: IndexDefinition[]
) => {
  dispatch(loadIndexes(indexes));
  dispatch({ type: RefreshActionTypes.RefreshFinished });
  dispatch(localAppRegistryEmit('indexes-changed', indexes));
};

export const fetchIndexes = (): ThunkAction<
  Promise<void>,
  RootState,
  void,
  LoadIndexesAction | RefreshFinishedAction | HandleErrorAction
> => {
  return async (dispatch, getState) => {
    const {
      isReadonly,
      dataService,
      namespace,
      sortColumn,
      sortOrder,
      inProgressIndexes,
    } = getState();

    if (isReadonly) {
      return _handleIndexesChanged(dispatch, []);
    }

    if (!dataService || !dataService.isConnected()) {
      dispatch({ type: RefreshActionTypes.RefreshFinished });
      debug(
        'warning: trying to load indexes but dataService is disconnected',
        dataService
      );
      return;
    }

    try {
      const indexes = await dataService.indexes(namespace);

      const allIndexes = _mergeInProgressIndexes(
        indexes,
        cloneDeep(inProgressIndexes) as InProgressIndex[]
      ).sort(_getSortFunction(_mapColumnToProp(sortColumn), sortOrder));

      _handleIndexesChanged(dispatch, allIndexes);
    } catch (err) {
      dispatch(handleError(err as IndexesError));
      _handleIndexesChanged(dispatch, []);
    }
  };
};

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

const _getSortFunction = (field: SortField, sortDirection: SortDirection) => {
  const order = sortDirection === 'asc' ? 1 : -1;
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

function _mergeInProgressIndexes(
  indexes: IndexDefinition[],
  inProgressIndexes: InProgressIndex[]
) {
  indexes = cloneDeep(indexes);

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

export const dropFailedIndex = (
  id: string
): ThunkAction<void, RootState, void, AnyAction> => {
  return (dispatch) => {
    dispatch(inProgressIndexRemoved(id));
    void dispatch(fetchIndexes());
  };
};
