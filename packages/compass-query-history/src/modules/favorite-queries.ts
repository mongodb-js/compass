import type { Action, AnyAction, Reducer } from 'redux';
import { combineReducers } from 'redux';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

import { FavoriteQuery, FavoriteQueryCollection } from '../models';
import { comparableQuery } from '../utils';
import { isAction } from '../utils/is-action';

const { track } = createLoggerAndTelemetry('COMPASS-QUERY-HISTORY-UI');

function saveFavorite(recent, name) {
  track('Query History Favorite Added');
  // TOOD: thunk this V
  options.actions.deleteRecent(recent); // If query shouldn't stay in recents after save

  const now = Date.now();
  const attributes = recent.getAttributes({ props: true });
  if (!attributes._host) {
    attributes._host = this.state.currentHost;
  }
  attributes._name = name;
  attributes._dateSaved = now;
  attributes._dateModified = now;

  const query = new FavoriteQuery(attributes);

  this.state.items.add(query);
  query.save();
  this.state.current = null;
  this.trigger(this.state);
},

// TODO: Thunk this V (Promise)
function deleteFavorite(query) {
  track('Query History Favorite Removed', {
    id: query._id,
    screen: 'documents',
  });
  query.destroy({
    success: () => {
      this.state.items.remove(query._id);
      this.trigger(this.state);
    },
  });
},

// TODO(COMPASS-6691): This (and probably all the other actions in this
// store) actually executes two times when clicking on an item in the list
function runQuery(query) {
  const existingQuery = this.state.items.find((item) => {
    return _.isEqual(comparableQuery(item), query);
  });
  if (existingQuery) {
    const item = existingQuery.serialize();
    track('Query History Favorite Used', {
      id: item._id,
      screen: 'documents',
    });
  }
  this.localAppRegistry.emit('query-history-run-query', query);
},

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

export const enum FaoriteQueriesActionTypes {
  SaveFavorite = 'compass-query-history/favorite-queries/SaveFavorite',
  DeleteFavorite = 'compass-query-history/favorite-queries/DeleteFavorite',

  RunFavoriteQuery = 'compass-query-history/favorite-queries/RunFavoriteQuery',
}

export type FavoriteQueriesState = {
  // items // Ampersand collection
  // current
};

export const initialState: FavoriteQueriesState = {
  // showing: 'recent',
  // ns: mongodbns(''),

  items: new FavoriteQueryCollection(),
  current: null,
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
  if (isAction<ShowFavoritesAction>(action, QueryHistoryActionTypes.ShowFavorites)) {
    track('Query History Favorites');

    return {
      ...state,
      showing: 'favorites'
    };
  }
  return state;
}

export {
  favoriteQueriesReducer
};
