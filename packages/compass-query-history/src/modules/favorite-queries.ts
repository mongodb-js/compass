import type { Action, AnyAction, Reducer } from 'redux';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

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
import { FavoriteQueryAmpersandCollectionType } from '../models/favorite-query-collection';

const { track } = createLoggerAndTelemetry('COMPASS-QUERY-HISTORY-UI');

export const enum FavoriteQueriesActionTypes {
  SaveFavoriteQuery = 'compass-query-history/favorite-queries/SaveFavoriteQuery',
  DeleteFavoriteQuery = 'compass-query-history/favorite-queries/DeleteFavoriteQuery',

  RunFavoriteQuery = 'compass-query-history/favorite-queries/RunFavoriteQuery',
}

type SaveFavoriteQueryAction = {
  type: FavoriteQueriesActionTypes.SaveFavoriteQuery;
  name: string;
  query: QueryModelType;
};

type DeleteFavoriteQueryAction = {
  type: FavoriteQueriesActionTypes.DeleteFavoriteQuery;
  queryId: string;
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
  return (dispatch) => {
    track('Query History Favorite Added');
    // TODO: thunk this V

    // options.actions.deleteRecent(recent); // If query shouldn't stay in recents after save

    // TODO: Should we auto navigate on favorite save?
    // Maybe not for now.

    dispatch({
      type: FavoriteQueriesActionTypes.SaveFavoriteQuery,
      query: recent,
      name,
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
    await new Promise<void>((resolve, reject) => {
      query.destroy({
        success: () => {
          // this.state.items.remove(query._id);
          // this.trigger(this.state);
          resolve();
        },
        error: function () {
          // TODO: Previously this was ignored (no error handle function),
          // we should also ignore it.
          reject();
        },
      });
    });
    dispatch({
      type: FavoriteQueriesActionTypes.DeleteFavoriteQuery,
      queryId,
    });
  };
};

// function getInitialState() {
//   return {
//     items: new FavoriteQueryCollection(),
//     current: null,
//     currentHost:
//       options.dataProvider?.dataProvider
//         ?.getConnectionString?.()
//         .hosts.join(',') ?? null,
//     ns: options.namespace,
//   };
// },
// });

export type FavoriteQueriesState = {
  // items // Ampersand collection
  // current
  // items: {
  //   // TODO: Types for ampersand collection
  //   add: (query: FavoriteQueryModelType) => void;
  //   remove: (queryId: string) => void;
  // };
  items: FavoriteQueryAmpersandCollectionType;
};

export const initialState: FavoriteQueriesState = {
  // showing: 'recent',
  // ns: mongodbns(''),

  items: new FavoriteQueryCollection(),
  current: null, // TODO: What is this used for ??
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
      // TODO: current host on state?
      _host: queryAttributes._host ?? state.currentHost,
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
      current: null,
    };
  }

  if (
    isAction<DeleteFavoriteQueryAction>(
      action,
      FavoriteQueriesActionTypes.DeleteFavoriteQuery
    )
  ) {
    state.items.remove(action.queryId);

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
