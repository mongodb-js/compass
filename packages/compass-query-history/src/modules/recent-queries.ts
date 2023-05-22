import type { Action, AnyAction, Reducer } from 'redux';
import { combineReducers } from 'redux';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';
import _ from 'lodash';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

import { comparableQuery } from '../utils/comparable-query';
import { formatQuery } from '../utils/format-query';
import { RecentQuery, RecentQueryCollection } from '../models';
import { isAction } from '../utils/is-action';
import type { QueryHistoryThunkAction } from './query-history';
import type { QueryAttributes, QueryModelType } from '../models/query';

const { track } = createLoggerAndTelemetry('COMPASS-QUERY-HISTORY-UI');

const TOTAL_RECENTS = 30;
type QueryParts = 'filter' | 'project' | 'sort' | 'skip' | 'limit' | 'collation';
type QueryQueryAttributes = Pick<
  QueryAttributes,
  QueryParts
>;
const QUERY_ITEMS: QueryParts[] = ['filter', 'project', 'sort', 'skip', 'limit', 'collation'];


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

type RunRecentQueryAction = {
  type: RecentQueriesActionTypes.RunRecentQuery;
};

/**
 * Filter attributes that aren't query fields or have default/empty values.
 * @param {object} attributes
 */
function _filterDefaults(
  _attributes: QueryAttributes
) {
  // Don't mutate the passed in parameter.
  const attributes = _.clone(_attributes);
  for (const key in attributes) {
    if (Object.prototype.hasOwnProperty.call(attributes, key)) {
      if (!attributes[key] || !QUERY_ITEMS.includes(key)) {
        delete attributes[key];
      } else if (
        _.isObject(attributes[key]) &&
        _.isEmpty(attributes[key])
      ) {
        delete attributes[key];
      }
    }
  }
  return attributes;
}

onConnected() {
  this.state.items.fetch({
    success: () => {
      this.trigger(this.state);
    },
  });
},

onQueryApplied(query) {
  this.addRecent(query);
},

export const addRecent = (_recent: QueryModelType): QueryHistoryThunkAction<
  void,
  | SaveRecentQueryAction
> => {
  return (dispatch, getState) => {
    const {
      ns
    } = getState();
    // TODO: where is ns stored??
    // const ns = this.state.ns;

    /* Ignore empty or default queries */
    const recent: QueryQueryAttributes = _filterDefaults(_recent);
    if (_.isEmpty(recent)) {
      return;
    }

    const filtered = this.state.items.filter((r) => {
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
      // update the existing query's lastExecuted to move it to the top
      existingQuery._lastExecuted = Date.now();
      existingQuery.save();
      return;
    }

    /* Keep length of each recent list to TOTAL_RECENTS */
    if (filtered.length >= TOTAL_RECENTS) {
      const lastRecent = filtered[TOTAL_RECENTS - 1];
      this.state.items.remove(lastRecent._id);
      lastRecent.destroy();
    }

    const query = new RecentQuery({
      ...recent,
      _lastExecuted: Date.now(),
      _ns: ns,
      _host: this.state.currentHost,
    });
    query._lastExecuted = Date.now();
    query._ns = ns;
    this.state.items.add(query);
    query.save();
    this.trigger(this.state);
  }
}

export const deleteRecent = (query): QueryHistoryThunkAction<
  Promise<void>,
  | DeleteRecentQueryAction
> => {
  return async (dispatch, getState) => {
    // TODO: Is deleting?
    const queryId = query._id;
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
        }
      });
    });
    dispatch({
      type: RecentQueriesActionTypes.DeleteRecentQuery,
      queryId
    })
  }
};

// TODO(COMPASS-6691): This (and probably all the other actions in this
// store) actually executes two times when clicking on an item in the list
runQuery(query) {
  if (
    this.state.items
      .map((item) => comparableQuery(item))
      .some((item) => {
        return _.isEqual(item, query);
      })
  ) {
    track('Query History Recent Used');
  }
  this.localAppRegistry.emit('query-history-run-query', query);
},

copyQuery(query) {
  const attributes = query.getAttributes({ props: true });

  Object.keys(attributes)
    .filter((key) => key.charAt(0) === '_')
    .forEach((key) => delete attributes[key]);

  navigator.clipboard.writeText(formatQuery(attributes));
},

// getInitialState() {
//   return {
//     items: new RecentQueryCollection(),
//     currentHost:
//       options.dataProvider?.dataProvider
//         ?.getConnectionString?.()
//         .hosts.join(',') ?? null,
//     ns: options.namespace,
//   };
// },



export type RecentQueriesState = {
  // items // Ampersand collection
  // current
};

export const initialState: RecentQueriesState = {
  items: new RecentQueryCollection(),
  currentHost:
    options.dataProvider?.dataProvider
      ?.getConnectionString?.()
      .hosts.join(',') ?? null, // TODO Do we need this duplicated?
  ns: options.namespace, // TODO Do we need this duplicated?
};

const recentQueriesReducer: Reducer<RecentQueriesState> = (
  state = initialState,
  action
) => {
  if (isAction<DeleteRecentQueryAction>(action, RecentQueriesActionTypes.DeleteRecentQuery)) {
    state.items.remove(action.queryId);

    return {
      ...state,
    };
  }
  return state;
}

export {
  recentQueriesReducer
};
