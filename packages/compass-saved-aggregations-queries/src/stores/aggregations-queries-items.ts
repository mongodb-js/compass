import type { Reducer } from 'redux';
import toNS from 'mongodb-ns';
import type { FavoriteQuery } from '@mongodb-js/compass-query-bar';
import type { StoredPipeline } from '@mongodb-js/compass-aggregations';
import type { SavedQueryAggregationThunkAction } from '.';
import type { Actions as DeleteItemActions } from './delete-item';
import { ActionTypes as DeleteItemActionTypes } from './delete-item';
import type { Actions as EditItemActions } from './edit-item';
import { ActionTypes as EditItemActionTypes } from './edit-item';

export enum ActionTypes {
  ITEMS_FETCHED = 'compass-saved-aggregations-queries/itemsFetched',
}

export type Actions = {
  type: ActionTypes.ITEMS_FETCHED;
  payload: Item[];
};

export type Item = {
  id: string;
  lastModified: number;
  name: string;
  database: string;
  collection: string;
} & (
  | {
      type: 'query';
      query: FavoriteQuery;
    }
  | {
      type: 'aggregation';
      aggregation: Omit<StoredPipeline, 'lastModified'>;
    }
);

export type State = {
  loading: boolean;
  items: Item[];
};

const INITIAL_STATE: State = {
  loading: true,
  items: [],
};

const reducer: Reducer<State, Actions | EditItemActions | DeleteItemActions> = (
  state = INITIAL_STATE,
  action
) => {
  switch (action.type) {
    case ActionTypes.ITEMS_FETCHED:
      return {
        ...state,
        items: action.payload,
        loading: false,
      };
    case DeleteItemActionTypes.DeleteItemConfirm: {
      const newItems = state.items.filter((item) => item.id !== action.id);
      return {
        ...state,
        items: newItems,
      };
    }
    case EditItemActionTypes.EditItemUpdated: {
      const item = state.items.find((x) => x.id === action.id);
      if (!item) {
        return state;
      }
      const updatedItem =
        item.type === 'query'
          ? mapQueryToItem(action.payload as FavoriteQuery)
          : mapAggregationToItem(action.payload as StoredPipeline);
      return {
        ...state,
        items: [...state.items.filter((x) => x.id !== action.id), updatedItem],
      };
    }
  }
  return state;
};

export const fetchItems = (): SavedQueryAggregationThunkAction<
  Promise<void>,
  Actions
> => {
  return async (
    dispatch,
    getState,
    { pipelineStorage, queryStorage }
  ): Promise<void> => {
    const payload = await Promise.allSettled([
      (await pipelineStorage.loadAll()).map(mapAggregationToItem),
      (await queryStorage.loadAll()).map(mapQueryToItem),
    ]);
    dispatch({
      type: ActionTypes.ITEMS_FETCHED,
      payload: payload
        .map((result) => (result.status === 'fulfilled' ? result.value : []))
        .flat(),
    });
  };
};

const mapAggregationToItem = (aggregation: StoredPipeline): Item => {
  const { database, collection } = toNS(aggregation.namespace);
  return {
    id: aggregation.id,
    lastModified: aggregation.lastModified ?? 0,
    name: aggregation.name,
    database,
    collection,
    type: 'aggregation',
    aggregation,
  };
};

const mapQueryToItem = (query: FavoriteQuery): Item => {
  const { database, collection } = toNS(query._ns);
  return {
    id: query._id,
    name: query._name,
    lastModified: (query._dateModified ?? query._dateSaved).getTime(),
    database,
    collection,
    type: 'query',
    query,
  };
};

export default reducer;
