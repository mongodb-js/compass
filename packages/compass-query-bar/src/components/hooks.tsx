import React, { useCallback, useContext, useMemo } from 'react';
import type QueryBar from './query-bar';
import { useSelector, useStore } from '../stores/context';
import type { ChangeFilterEvent } from '../modules/change-filter';
import { applyFilterChange } from '../stores/query-bar-reducer';
import { mapFormFieldsToQuery } from '../utils/query';
import { createServiceLocator } from 'compass-app-registry';
import type { RootState } from '../stores/query-bar-store';
import { isQueryEqual } from '../utils';
import type { BaseQuery } from '../constants/query-properties';
import { cloneDeep } from 'lodash';
import { DEFAULT_QUERY_VALUES } from '../constants/query-bar-store';

function NoOpQueryBarComponent() {
  return <></>;
}

const QueryBarComponentContext = React.createContext<
  React.FC<React.ComponentProps<typeof QueryBar>>
>(NoOpQueryBarComponent);

export const QueryBarComponentProvider = QueryBarComponentContext.Provider;

export const useQueryBarComponent = () => {
  return useContext(QueryBarComponentContext);
};

/**
 * Returns the current parsed query document derived from the field values in
 * the query bar
 */
export function useQueryBarQuery() {
  const fields = useSelector((state) => {
    return state.queryBar.fields;
  });
  return useMemo(() => {
    return mapFormFieldsToQuery(fields);
  }, [fields]);
}

const DEFAULT_QUERY: BaseQuery = cloneDeep(DEFAULT_QUERY_VALUES);

function selectLastAppliedQuery(
  state: RootState,
  source: string | null = null
) {
  source ??= state.queryBar.lastAppliedQuery.source;
  return source
    ? state.queryBar.lastAppliedQuery.query[source] ?? DEFAULT_QUERY
    : DEFAULT_QUERY;
}

/**
 * Returns the query that was last applied (query bar field values at the moment
 * of "Apply" or "Reset" buttons being clicked). If `source` value is provided,
 * returns query last applied from a specific part of the application, otherwise
 * returns whatever was the last applied query in general
 */
export function useLastAppliedQuery(source: string | null = null) {
  return useSelector((state) => {
    return selectLastAppliedQuery(state, source);
  });
}

/**
 * Returns `true` if the last applied query for the provided `source` doesn't
 * match the last applied query bar disregarding the source that triggered the
 * "Apply"
 */
export function useIsLastAppliedQueryOutdated(source: string) {
  return useSelector((state) => {
    const lastApplied = selectLastAppliedQuery(state);
    const lastAppliedForSource = selectLastAppliedQuery(state, source);
    return !isQueryEqual(lastApplied, lastAppliedForSource);
  });
}

export function useChangeQueryBarQuery() {
  const store = useStore();
  return useCallback(
    <T extends ChangeFilterEvent['type']>(
      type: T,
      payload: Extract<ChangeFilterEvent, { type: T }>['payload']
    ) => {
      store.dispatch(applyFilterChange({ type, payload } as ChangeFilterEvent));
    },
    [store]
  );
}

export const queryBarServiceLocator = createServiceLocator(
  function useQueryBarServiceLocator() {
    const store = useStore();
    const changeQuery = useChangeQueryBarQuery();
    return {
      getCurrentQuery() {
        return mapFormFieldsToQuery(store.getState().queryBar.fields);
      },
      getLastAppliedQuery(source: string | null = null) {
        return selectLastAppliedQuery(store.getState(), source);
      },
      changeQuery,
    };
  },
  'queryBarServiceLocator'
);

export type QueryBarService = ReturnType<typeof queryBarServiceLocator>;
