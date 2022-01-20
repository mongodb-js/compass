import { AnyAction, Dispatch } from 'redux';
import { getAggregations } from './../utlis/aggregations';
import { getQueries } from './../utlis/queries';

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
  namespace: string;
  type: 'query' | 'aggregation';
};

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
        .filter(Boolean)
        .flat(),
    });
  };
};

const getAggregationItems = async (): Promise<Item[]> => {
  const aggregations = await getAggregations();
  return aggregations.map((aggregation) => ({
    id: aggregation.id,
    lastModified: aggregation.lastModified,
    name: aggregation.name,
    namespace: aggregation.namespace,
    type: 'aggregation',
  }));
};

const getQueryItems = async (): Promise<Item[]> => {
  const queries = await getQueries();
  return queries.map((query) => ({
    id: query._id,
    lastModified: query._dateSaved,
    name: query._name,
    namespace: query._ns,
    type: 'query',
  }));
};

export default reducer;
