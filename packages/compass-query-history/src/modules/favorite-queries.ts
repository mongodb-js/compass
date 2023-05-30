import type { Reducer } from 'redux';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { promisifyAmpersandMethod } from '@mongodb-js/compass-utils';

import { FavoriteQuery, FavoriteQueryCollection } from '../models';
import { isAction } from '../utils/is-action';
import type { QueryHistoryThunkAction } from './query-history';
import type { DeleteRecentQueryAction } from './recent-queries';
import { deleteRecent } from './recent-queries';
import type { QueryModelType } from '../models/query';
import type {
  FavoriteQueryAttributes,
  FavoriteQueryModelType,
} from '../models/favorite-query';
import type { FavoriteQueryAmpersandCollectionType } from '../models/favorite-query-collection';

const { track } = createLoggerAndTelemetry('COMPASS-QUERY-HISTORY-UI');

export const enum FavoriteQueriesActionTypes {
  LoadFavoriteQueries = 'compass-query-history/favorite-queries/LoadFavoriteQueries',
  SaveFavoriteQuery = 'compass-query-history/favorite-queries/SaveFavoriteQuery',
  DeleteFavoriteQuery = 'compass-query-history/favorite-queries/DeleteFavoriteQuery',

  RunFavoriteQuery = 'compass-query-history/favorite-queries/RunFavoriteQuery',
}

type SaveFavoriteQueryAction = {
  type: FavoriteQueriesActionTypes.SaveFavoriteQuery;
  name: string;
  query: QueryModelType;
  currentHost?: string;
};

type DeleteFavoriteQueryAction = {
  type: FavoriteQueriesActionTypes.DeleteFavoriteQuery;
  queryId: string;
};

export type LoadFavoriteQueriesAction = {
  type: FavoriteQueriesActionTypes.LoadFavoriteQueries;
};

export const loadFavoriteQueries = (): QueryHistoryThunkAction<
  Promise<void>,
  LoadFavoriteQueriesAction
> => {
  return async (dispatch, getState) => {
    const {
      favoriteQueries: { items },
    } = getState();

    // TODO: Should we try catch this.
    const fetchRecentQueries = promisifyAmpersandMethod(
      items.fetch.bind(items)
    );

    await fetchRecentQueries();

    dispatch({
      type: FavoriteQueriesActionTypes.LoadFavoriteQueries,
    });
  };
};

export type RunFavoriteQueryAction = {
  type: FavoriteQueriesActionTypes.RunFavoriteQuery;
  queryAttributes: FavoriteQueryAttributes;
};

export const runFavoriteQuery = (
  queryAttributes: FavoriteQueryAttributes
): RunFavoriteQueryAction => ({
  type: FavoriteQueriesActionTypes.RunFavoriteQuery,
  queryAttributes,
});

export const saveFavorite = (
  recent: QueryModelType,
  name: string
): QueryHistoryThunkAction<
  void,
  DeleteRecentQueryAction | SaveFavoriteQueryAction
> => {
  return (dispatch, getState) => {
    const {
      queryHistory: { currentHost },
    } = getState();

    track('Query History Favorite Added');
    // TODO: thunk this V

    // options.actions.deleteRecent(recent); // If query shouldn't stay in recents after save

    // TODO: Should we auto navigate on favorite save?
    // Maybe not for now.
    // TODO: Dispatch auto switch to saved favorites (was in the component before.)

    dispatch({
      type: FavoriteQueriesActionTypes.SaveFavoriteQuery,
      query: recent,
      name,
      currentHost,
    });

    // Ignore failures.
    void dispatch(deleteRecent(recent));
    // dispatch({
    //   type: RecentQueriesActionTypes.DeleteRecentQuery,

    // })
  };
};

export const deleteFavorite = (
  query: FavoriteQueryModelType
): QueryHistoryThunkAction<Promise<void>, DeleteFavoriteQueryAction> => {
  return async (dispatch) => {
    // TODO: Is deleting?
    const queryId = query._id;

    track('Query History Favorite Removed', {
      id: query._id,
      screen: 'documents',
    });

    // TODO: Previously this was ignored (no error handle function),
    // we should also ignore it.
    const deleteQuery = promisifyAmpersandMethod(query.destroy.bind(query));
    await deleteQuery();

    // TODO: State trigger?

    dispatch({
      type: FavoriteQueriesActionTypes.DeleteFavoriteQuery,
      queryId,
    });
  };
};

//     current: null,

export type FavoriteQueriesState = {
  // current
  items: FavoriteQueryAmpersandCollectionType;
};

export const initialState: FavoriteQueriesState = {
  items: new FavoriteQueryCollection(),
  // current: null, // TODO: What is this used for ??
};

const favoriteQueriesReducer: Reducer<FavoriteQueriesState> = (
  state = initialState,
  action
) => {
  if (
    isAction<SaveFavoriteQueryAction>(
      action,
      FavoriteQueriesActionTypes.SaveFavoriteQuery
    )
  ) {
    track('Query History Favorites');

    const now = Date.now();
    const queryAttributes = action.query.getAttributes({ props: true });
    const attributes: FavoriteQueryAttributes = {
      ...queryAttributes,
      _host: queryAttributes._host ?? action.currentHost,
      _name: action.name,
      _dateSaved: now,
      _dateModified: now,
    };

    const query = new FavoriteQuery(attributes) as FavoriteQueryModelType;

    state.items.add(query);
    // TODO: We should async request and loading state all of these.
    query.save();

    return {
      ...state,
      // current: null,
    };
  }

  if (
    isAction<DeleteFavoriteQueryAction>(
      action,
      FavoriteQueriesActionTypes.DeleteFavoriteQuery
    )
  ) {
    // TODO: Should we promisifyAmpersandMethod?
    state.items.remove(action.queryId);

    return {
      ...state,
    };
  }

  if (
    isAction<LoadFavoriteQueriesAction>(
      action,
      FavoriteQueriesActionTypes.LoadFavoriteQueries
    )
  ) {
    // TODO: What to do to refresh items.

    return {
      ...state,
    };
  }

  if (
    isAction<RunFavoriteQueryAction>(
      action,
      FavoriteQueriesActionTypes.RunFavoriteQuery
    )
  ) {
    track('Query History Favorite Used', {
      id: action.queryAttributes._id,
      screen: 'documents',
    });

    return {
      ...state,
    };
  }

  return state;
};

export { favoriteQueriesReducer };
