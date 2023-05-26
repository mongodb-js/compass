import type { Action, AnyAction, Reducer } from 'redux';
import { combineReducers } from 'redux';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';
import _ from 'lodash';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

import { comparableQuery } from '../utils/comparable-query';
import { RecentQuery, RecentQueryCollection } from '../models';
import { isAction } from '../utils/is-action';
import type { QueryHistoryThunkAction } from './query-history';
import type { QueryAttributes, QueryModelType } from '../models/query';
import type { RecentQueryAmpersandCollectionType } from '../models/recent-query-collection';

const { track } = createLoggerAndTelemetry('COMPASS-QUERY-HISTORY-UI');

const TOTAL_RECENTS = 30;
type QueryParts =
  | 'filter'
  | 'project'
  | 'sort'
  | 'skip'
  | 'limit'
  | 'collation';
type QueryQueryAttributes = Pick<QueryAttributes, QueryParts>;
const QUERY_ITEMS: QueryParts[] = [
  'filter',
  'project',
  'sort',
  'skip',
  'limit',
  'collation',
];

export const enum RecentQueriesActionTypes {
  SaveRecentQuery = 'compass-query-history/recent-queries/SaveRecentQuery',
  DeleteRecentQuery = 'compass-query-history/recent-queries/DeleteRecentQuery',

  RunRecentQuery = 'compass-query-history/recent-queries/RunFavoriteQuery',
}

type SaveRecentQueryAction = {
  type: RecentQueriesActionTypes.SaveRecentQuery;
};

export type DeleteRecentQueryAction = {
  type: RecentQueriesActionTypes.DeleteRecentQuery;
  queryId: string;
};

export type RunRecentQueryAction = {
  type: RecentQueriesActionTypes.RunRecentQuery;
  queryAttributes: QueryAttributes;
};

export const runRecentQuery = (
  queryAttributes: QueryAttributes
): RunRecentQueryAction => ({
  type: RecentQueriesActionTypes.RunRecentQuery,
  queryAttributes,
});

/**
 * Filter attributes that aren't query fields or have default/empty values.
 */
function _filterDefaults(_attributes: QueryAttributes) {
  // Don't mutate the passed in parameter.
  const attributes = _.clone(_attributes);
  for (const key in attributes) {
    if (Object.prototype.hasOwnProperty.call(attributes, key)) {
      if (
        !attributes[key as keyof typeof attributes] ||
        !QUERY_ITEMS.includes(key as QueryParts)
      ) {
        delete attributes[key as keyof typeof attributes];
      } else if (
        _.isObject(attributes[key as keyof typeof attributes]) &&
        _.isEmpty(attributes[key as keyof typeof attributes])
      ) {
        delete attributes[key as keyof typeof attributes];
      }
    }
  }
  return attributes;
}

//TODO: this and on applied
// onConnected() {
//   this.state.items.fetch({
//     success: () => {
//       this.trigger(this.state);
//     },
//   });
// },

// onQueryApplied(query) {
//   this.addRecent(query);
// },

export const addRecent = (
  _recent: QueryModelType
): QueryHistoryThunkAction<void, SaveRecentQueryAction> => {
  return (dispatch, getState) => {
    const {
      queryHistory: {
        ns: { ns },
      },
      recentQueries: { items },
    } = getState();

    /* Ignore empty or default queries */
    const recent: QueryQueryAttributes = _filterDefaults(_recent);
    if (_.isEmpty(recent)) {
      return;
    }

    const filtered = items.filter((r) => {
      return r._ns === ns;
    });

    /* Ignore duplicate queries */
    const existingQuery = filtered.find((item) =>
      _.isEqual(comparableQuery(item), recent)
    );
    if (existingQuery) {
      if (!existingQuery._host) {
        existingQuery._host = this.state.currentHost;
      }
      // Update the existing query's lastExecuted to move it to the top.
      existingQuery._lastExecuted = Date.now();
      existingQuery.save();
      return;
    }

    /* Keep length of each recent list to TOTAL_RECENTS */
    if (filtered.length >= TOTAL_RECENTS) {
      const lastRecent = filtered[TOTAL_RECENTS - 1];
      items.remove(lastRecent._id);
      lastRecent.destroy(/* ignore success + error */);
    }

    const query = new RecentQuery({
      ...recent,
      _lastExecuted: Date.now(),
      _ns: ns,
      _host: this.state.currentHost,
    }) as QueryModelType;
    query._lastExecuted = Date.now();
    query._ns = ns;
    items.add(query);
    query.save();
    // TODO: Somehow tell store to update and refresh the queries.
    // this.trigger(this.state);
  };
};

export const deleteRecent = (
  queryModel: QueryModelType
): QueryHistoryThunkAction<Promise<void>, DeleteRecentQueryAction> => {
  return async (dispatch, getState) => {
    // TODO: Is deleting?
    const queryId = queryModel._id;
    await new Promise<void>((resolve, reject) => {
      queryModel.destroy({
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
      type: RecentQueriesActionTypes.DeleteRecentQuery,
      queryId,
    });
  };
};

// getInitialState() {
//   return {
//     items: new RecentQueryCollection(),
// },

export type RecentQueriesState = {
  items: RecentQueryAmpersandCollectionType;
};

export const initialState: RecentQueriesState = {
  items: new RecentQueryCollection(),
};

const recentQueriesReducer: Reducer<RecentQueriesState> = (
  state = initialState,
  action
) => {
  if (
    isAction<DeleteRecentQueryAction>(
      action,
      RecentQueriesActionTypes.DeleteRecentQuery
    )
  ) {
    state.items.remove(action.queryId);

    return {
      ...state,
    };
  }

  if (
    isAction<RunRecentQueryAction>(
      action,
      RecentQueriesActionTypes.RunRecentQuery
    )
  ) {
    track('Query History Recent Used');

    return {
      ...state,
    };
  }

  return state;
};

export { recentQueriesReducer };
