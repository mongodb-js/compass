import type { Dispatch, Reducer } from 'redux';
import toNS from 'mongodb-ns';
import { FavoriteQueryStorage } from '@mongodb-js/compass-query-history';
import type { Query } from '@mongodb-js/compass-query-history';
import { PipelineStorage } from '@mongodb-js/compass-aggregations';
import type { Aggregation } from '@mongodb-js/compass-aggregations';
import type { ThunkAction } from 'redux-thunk';
import type { RootState } from '.';
import type { Actions as DeleteItemActions } from './delete-item';
import { ActionTypes as DeleteItemActionTypes } from './delete-item';

export enum ActionTypes {
  ITEMS_FETCHED = 'compass-saved-aggregations-queries/itemsFetched',
  ITEM_DELETED = 'compass-saved-aggregations-queries/itemDeleted',
}

export type Actions =
  | {
      type: ActionTypes.ITEMS_FETCHED;
      payload: Item[];
    }
  | {
      type: ActionTypes.ITEM_DELETED;
      id: string;
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
      query: Query;
    }
  | {
      type: 'aggregation';
      aggregation: Omit<Aggregation, 'lastModified'>;
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

const favoriteQueryStorage = new FavoriteQueryStorage();
const pipelineStorage = new PipelineStorage();

const reducer: Reducer<State, Actions | DeleteItemActions> = (
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
  }
  return state;
};

export const fetchItems = (): ThunkAction<void, RootState, void, Actions> => {
  return async (dispatch: Dispatch<Actions>): Promise<void> => {
    const payload = await Promise.allSettled([
      getAggregationItems(),
      getQueryItems(),
    ]);
    dispatch({
      type: ActionTypes.ITEMS_FETCHED,
      payload: payload
        .map((result: PromiseSettledResult<Item[]>) =>
          result.status === 'fulfilled' ? result.value : []
        )
        .flat(),
    });
  };
};

const getAggregationItems = async (): Promise<Item[]> => {
  const aggregations = await pipelineStorage.loadAll();
  return aggregations.map((aggregation) => {
    const { database, collection } = toNS(aggregation.namespace);
    return {
      id: aggregation.id,
      lastModified: aggregation.lastModified,
      name: aggregation.name,
      database,
      collection,
      type: 'aggregation',
      aggregation,
    };
  });
};

const getQueryItems = async (): Promise<Item[]> => {
  const queries = await favoriteQueryStorage.loadAll();
  return queries.map((query) => {
    const { database, collection } = toNS(query._ns);
    return {
      id: query._id,
      name: query._name,
      lastModified: query._dateModified ?? query._dateSaved,
      database,
      collection,
      type: 'query',
      query,
    };
  });
};

export default reducer;
