import type { Action, AnyAction, Reducer } from 'redux';
import { combineReducers } from 'redux';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import mongodbns from 'mongodb-ns';

import { isAction } from '../utils/is-action';

const { track } = createLoggerAndTelemetry('COMPASS-QUERY-HISTORY-UI');

export const enum QueryHistoryActionTypes {
  ShowFavorites = 'compass-query-history/ShowFavorites',
  ShowRecent = 'compass-query-history/ShowRecent',

  NamespaceChanged = 'compass-query-history/NamespaceChanged',
}

type ShowFavoritesAction = {
  type: QueryHistoryActionTypes.ShowFavorites;
};

type ShowRecentAction = {
  type: QueryHistoryActionTypes.ShowRecent;
};

type NamespaceChangedAction = {
  type: QueryHistoryActionTypes.NamespaceChanged;
  namespace: string;
};

export type QueryHistoryState = {
  // TODO
  showing: 'recent' | 'favorites';
  ns: ReturnType<typeof mongodbns>;
};

export const initialState: QueryHistoryState = {
  showing: 'recent',
  ns: mongodbns(''),
};

const queryHistoryReducer: Reducer<QueryHistoryState> = (
  state = initialState,
  action
) => {
  if (
    isAction<ShowFavoritesAction>(action, QueryHistoryActionTypes.ShowFavorites)
  ) {
    track('Query History Favorites');

    return {
      ...state,
      showing: 'favorites',
    };
  }

  if (isAction<ShowRecentAction>(action, QueryHistoryActionTypes.ShowRecent)) {
    track('Query History Recent');

    return {
      ...state,
      showing: 'recent',
    };
  }

  if (
    isAction<NamespaceChangedAction>(
      action,
      QueryHistoryActionTypes.NamespaceChanged
    )
  ) {
    const nsobj = mongodbns(action.namespace);
    return {
      ...state,
      ns: nsobj,
    };
  }

  return state;
};

const rootReducer = combineReducers({
  queryHistory: queryHistoryReducer,
  // globalAppRegistry,
  // dataService,
  // TODO: Favorites, recents.
});

export type RootState = ReturnType<typeof rootReducer>;

export type ExportThunkDispatch<A extends Action = AnyAction> = ThunkDispatch<
  RootState,
  void,
  A
>;

export type ExportThunkAction<R, A extends Action = AnyAction> = ThunkAction<
  R,
  RootState,
  void,
  A
>;

export { rootReducer };
