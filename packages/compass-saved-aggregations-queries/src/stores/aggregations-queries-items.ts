import type { Dispatch, Reducer } from 'redux';
import toNS from 'mongodb-ns';
import { FavoriteQueryStorage } from '@mongodb-js/compass-query-history';
import { PipelineStorage } from '@mongodb-js/compass-aggregations';
import type { ThunkAction } from 'redux-thunk';
import type { RootState } from '.';

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

interface Query {
  _id: string;
  _name: string;
  _ns: string;
  _dateSaved: number;

  collation?: Record<string, unknown>;
  filter?: Record<string, unknown>;
  limit?: number;
  project?: Record<string, unknown>;
  skip?: number;
  sort?: Record<string, number>;
}

interface Aggregation {
  id: string;
  name: string;
  namespace: string;
  lastModified: number;

  autoPreview?: boolean;
  collation?: string;
  collationString?: string;
  comments?: boolean;
  env?: string;
  isReadonly?: boolean;
  isTimeSeries?: boolean;
  pipeline: Pipeline[];
  sample?: boolean;
  sourceName?: string;
}

interface Pipeline {
  id: string;
  stageOperator: string;
  stage: string;
  isValid: boolean;
  isEnabled: boolean;
  isExpanded: boolean;
  isLoading: boolean;
  isComplete: boolean;
  previewDocuments: unknown[];
  syntaxError: unknown;
  error: unknown;
  projections?: unknown[];
  fromStageOperators?: boolean;
  executor?: unknown;
  isMissingAtlasOnlyStageSupport?: boolean;
}

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

const reducer: Reducer<State, Actions> = (state = INITIAL_STATE, action) => {
  if (action.type === ActionTypes.ITEMS_FETCHED) {
    return {
      ...state,
      items: action.payload,
      loading: false,
    };
  }
  if (action.type === ActionTypes.ITEM_DELETED) {
    const newItems = state.items.filter((item) => item.id !== action.id);
    return {
      ...state,
      items: newItems,
    };
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

export const deleteItem = (
  id: string
): ThunkAction<void, RootState, void, Actions> => {
  return async (dispatch: Dispatch<Actions>, getState) => {
    const {
      savedItems: { items },
    } = getState();
    const item = items.find((x) => x.id === id);
    if (!item) {
      return;
    }
    const deleteAction =
      item.type === 'query'
        ? favoriteQueryStorage.delete.bind(favoriteQueryStorage)
        : pipelineStorage.delete.bind(pipelineStorage);
    await deleteAction(id);
    dispatch({
      type: ActionTypes.ITEM_DELETED,
      id,
    });
  };
};

const getAggregationItems = async (): Promise<Item[]> => {
  const aggregations: Aggregation[] = await pipelineStorage.loadAll();
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
  const queries: Query[] = await favoriteQueryStorage.loadAll();
  return queries.map((query) => {
    const { database, collection } = toNS(query._ns);
    return {
      id: query._id,
      name: query._name,
      lastModified: query._dateSaved,
      database,
      collection,
      type: 'query',
      query,
    };
  });
};

export default reducer;
