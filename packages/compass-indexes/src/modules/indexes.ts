import IndexModel from 'mongodb-index-model';
import type { Document } from 'mongodb';
import { localAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';
import _debug from 'debug';

import type { RootState } from './index';
import { handleError } from './error';
import type { HandleErrorAction, IndexesError } from './error';
import { ActionTypes as RefreshActionTypes } from './is-refreshing';
import type { RefreshFinishedAction } from './is-refreshing';

const debug = _debug('mongodb-compass:modules:indexes');

type SortField = keyof Pick<
  IndexDefinition,
  'name' | 'type' | 'size' | 'usageCount' | 'properties'
>;
export type SortColumn = keyof typeof sortColumnToProps;
export type SortDirection = 'asc' | 'desc';
const sortColumnToProps: Record<string, SortField> = {
  'Name and Definition': 'name',
  Type: 'type',
  Size: 'size',
  Usage: 'usageCount',
  Properties: 'properties',
};

export type IndexDefinition = {
  name: string;
  fields: {
    serialize: () => { field: string; value: number | string }[];
  };
  type: 'geo' | 'hashed' | 'text' | 'wildcard' | 'clustered' | 'columnstore';
  cardinality: 'single' | 'compound';
  properties: ('unique' | 'sparse' | 'partial' | 'ttl' | 'collation')[];
  extra: Record<string, string | number | Record<string, any>>;
  size: number;
  relativeSize: number;
  usageCount: number;
  usageSince?: Date;
};

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
  void,
  RootState,
  void,
  LoadIndexesAction | RefreshFinishedAction | HandleErrorAction
> => {
  return (dispatch, getState) => {
    const { isReadonly, dataService, namespace, sortColumn, sortOrder } =
      getState();

    if (isReadonly) {
      return _handleIndexesChanged(dispatch, []);
    }

    if (!dataService) {
      dispatch({ type: RefreshActionTypes.RefreshFinished });
      debug(
        'warning: trying to load indexes but dataService is disconnected',
        dataService
      );
      return;
    }

    dataService.indexes(namespace, {}, (err: any, indexes: Document[]) => {
      if (err) {
        dispatch(handleError(err as IndexesError));
        return _handleIndexesChanged(dispatch, []);
      }
      // Set the `ns` field manually as it is not returned from the server
      // since version 4.4.
      for (const index of indexes) {
        index.ns = namespace;
      }
      const ixs = _mapAndSort(indexes, sortColumn, sortOrder);
      return _handleIndexesChanged(dispatch, ixs);
    });
  };
};

const _getSortFunctionForProperties = (order: 1 | -1) => {
  return function (a: IndexDefinition, b: IndexDefinition) {
    const aValue =
      a.cardinality === 'compound' ? 'compound' : a.properties[0] || '';
    const bValue =
      b.cardinality === 'compound' ? 'compound' : b.properties[0] || '';
    if (aValue > bValue) {
      return order;
    }
    if (aValue < bValue) {
      return -order;
    }
    return 0;
  };
};

const _getSortFunction = (field: SortField, order: SortDirection) => {
  const _order = order === 'asc' ? 1 : -1;
  if (field === 'properties') {
    return _getSortFunctionForProperties(_order);
  }
  return function (a: IndexDefinition, b: IndexDefinition) {
    if (a[field] > b[field]) {
      return _order;
    }
    if (a[field] < b[field]) {
      return -_order;
    }
    return 0;
  };
};

const _mapColumnToProp = (column: SortColumn): SortField => {
  return sortColumnToProps[column];
};

/**
 * Converts the raw index data (from ampersand) to
 * Index models (IndexDefinition) and adds computed props.
 */
const _convertToModels = (indexes: Document[]): IndexDefinition[] => {
  const sizes = indexes.map((index) => index.size);
  const maxSize = Math.max(...sizes);

  return indexes.map((index) => {
    const model = new IndexModel(new IndexModel().parse(index));
    model.relativeSize = (model.size / maxSize) * 100;
    return model as IndexDefinition;
  });
};

const _mapAndSort = (
  indexes: Document[],
  sortColumn: SortColumn,
  sortOrder: SortDirection
) => {
  return _convertToModels(indexes).sort(
    _getSortFunction(_mapColumnToProp(sortColumn), sortOrder)
  );
};
