import type { Reducer } from 'redux';
import _ from 'lodash';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { promisifyAmpersandMethod } from '@mongodb-js/compass-utils';

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

  RunRecentQuery = 'compass-query-history/recent-queries/RunRecentQuery',
  LoadRecentQueries = 'compass-query-history/recent-queries/LoadRecentQueries',
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

type LoadRecentQueriesAction = {
  type: RecentQueriesActionTypes.LoadRecentQueries;
};

export const runRecentQuery = (
  queryAttributes: QueryAttributes
): RunRecentQueryAction => ({
  type: RecentQueriesActionTypes.RunRecentQuery,
  queryAttributes,
});

export const loadRecentQueries = (): QueryHistoryThunkAction<
  Promise<void>,
  LoadRecentQueriesAction
> => {
  return async (dispatch, getState) => {
    const {
      recentQueries: { items },
    } = getState();

    // TODO: Should we try catch this.
    const fetchRecentQueries = promisifyAmpersandMethod(
      items.fetch.bind(items)
    );
    await fetchRecentQueries();

    dispatch({
      type: RecentQueriesActionTypes.LoadRecentQueries,
    });
  };
};

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

export const addRecent = (
  _recent: QueryModelType
): QueryHistoryThunkAction<void, SaveRecentQueryAction> => {
  return (dispatch, getState) => {
    const {
      queryHistory: {
        ns: { ns },
        currentHost,
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
        existingQuery._host = currentHost;
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
      _host: currentHost,
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
  return async (dispatch) => {
    // TODO: Is deleting?
    const queryId = queryModel._id;

    // TODO: Previously this was ignored (no error handle function),
    // we should also ignore it.
    const deleteQuery = promisifyAmpersandMethod(
      queryModel.destroy.bind(queryModel)
    );
    await deleteQuery();

    // TODO: State trigger?

    dispatch({
      type: RecentQueriesActionTypes.DeleteRecentQuery,
      queryId,
    });
  };
};

export type RecentQueriesState = {
  items: RecentQueryAmpersandCollectionType;
};

const getInitialState = (): RecentQueriesState => ({
  items: new RecentQueryCollection(),
});

const recentQueriesReducer: Reducer<RecentQueriesState> = (
  state = getInitialState(),
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
    isAction<LoadRecentQueriesAction>(
      action,
      RecentQueriesActionTypes.LoadRecentQueries
    )
  ) {
    // TODO: Refresh state items?

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
