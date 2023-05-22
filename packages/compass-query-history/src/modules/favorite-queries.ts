import type { Action, AnyAction, Reducer } from 'redux';
import { combineReducers } from 'redux';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

import { FavoriteQuery, FavoriteQueryCollection } from '../models';
import { comparableQuery } from '../utils/comparable-query';
import { isAction } from '../utils/is-action';
import type { QueryHistoryThunkAction } from './query-history';
import type { DeleteRecentQueryAction } from './recent-queries';
import { deleteRecent } from './recent-queries';
import type { QueryModelType } from '../models/query';
import type {
  FavoriteQueryAttributes,
  FavoriteQueryModelType,
} from '../models/favorite-query';

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

// type ShowFavoritesAction = {
//   type: QueryHistoryActionTypes.ShowFavorites;
// };

// export function showFavorites(): ShowFavoritesAction {
//   return {
//     type: QueryHistoryActionTypes.ShowFavorites
//   };
// }

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

// TODO(COMPASS-6691): This (and probably all the other actions in this
// store) actually executes two times when clicking on an item in the list
// TODO: This might go away as we aren't using the same function in both
// recent and favorites.
// function runQuery(query: FavoriteQueryModelType) {
export function runFavoriteQuery(query: FavoriteQueryModelType) {
  // TODO: This doesn't even need to be an action, move to component?
  track('Query History Favorite Used', {
    id: query._id,
    screen: 'documents',
  });

  this.localAppRegistry.emit('query-history-run-query', query);
}

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
  items: {
    // TODO: Types for ampersand collection
    add: (query: FavoriteQueryModelType) => void;
    remove: (queryId: string) => void;
  };
};

export const initialState: FavoriteQueriesState = {
  // showing: 'recent',
  // ns: mongodbns(''),

  items: new FavoriteQueryCollection(),
  current: null, // TODO: What is this used for ??
  currentHost:
    options.dataProvider?.dataProvider
      ?.getConnectionString?.()
      .hosts.join(',') ?? null, // TODO: ????
  ns: options.namespace, // TODO Do we need this duplicated?
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

    const query = new FavoriteQuery(attributes);

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

  return state;
};

export { favoriteQueriesReducer };
