import { AnyAction, Dispatch } from 'redux';
// TODO: Add declarations to the package, otherwise it will be like third time
// we have to copy-paste them around
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import toNS from 'mongodb-ns';
import { QueryStorage } from '@mongodb-js/compass-query-history';
import { readPipelinesFromStorage } from '@mongodb-js/compass-aggregations';

enum actions {
  ITEMS_FETCHED = 'itemsFetched',
}

type StateActions = {
  type: actions.ITEMS_FETCHED;
  payload: Item[];
};

export type Item = {
  id: string;
  lastModified: number;
  name: string;
  database: string;
  collection: string;
  type: 'query' | 'aggregation';
};

interface Query {
  _id: string;
  _name: string;
  _ns: string;
  _dateSaved: number;
}

interface Aggregation {
  id: string;
  name: string;
  namespace: string;
  lastModified: number;
}

export type State = {
  loading: boolean;
  items: Item[];
};

const INITIAL_STATE: State = {
  loading: true,
  items: [],
};

function reducer(
  state = INITIAL_STATE,
  action: StateActions | AnyAction
): State {
  const newState = { ...state };
  if (action.type === actions.ITEMS_FETCHED) {
    newState.items = action.payload;
    newState.loading = false;
  }
  return newState;
}

export const fetchItems = () => {
  return async (dispatch: Dispatch<StateActions>): Promise<void> => {
    const payload = await Promise.allSettled([
      getAggregationItems(),
      getQueryItems(),
    ]);
    dispatch({
      type: actions.ITEMS_FETCHED,
      payload: payload
        .map((result: PromiseSettledResult<Item[]>) =>
          result.status === 'fulfilled' ? result.value : []
        )
        .flat(),
    });
  };
};

const queryStorage = new QueryStorage();

const getAggregationItems = async (): Promise<Item[]> => {
  const aggregations: Aggregation[] = await readPipelinesFromStorage();
  return aggregations.map((aggregation) => {
    const { database, collection } = toNS(aggregation.namespace);
    return {
      id: aggregation.id,
      lastModified: aggregation.lastModified,
      name: aggregation.name,
      database,
      collection,
      type: 'aggregation',
    };
  });
};

const getQueryItems = async (): Promise<Item[]> => {
  const queries: Query[] = await queryStorage.loadAll();
  return queries.map((query) => {
    const { database, collection } = toNS(query._ns);
    return {
      id: query._id,
      name: query._name,
      lastModified: query._dateSaved,
      database,
      collection,
      type: 'query',
    };
  });
};

export default reducer;
