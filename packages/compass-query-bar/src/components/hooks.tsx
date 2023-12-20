import React, { useCallback, useContext, useMemo } from 'react';
import type QueryBar from './query-bar';
import { useSelector, useStore } from '../stores/context';
import type { ChangeFilterEvent } from '../modules/change-filter';
import { applyFilterChange } from '../stores/query-bar-reducer';
import { mapFormFieldsToQuery } from '../utils/query';

const QueryBarComponentContext = React.createContext<typeof QueryBar>(
  (() => null) as unknown as typeof QueryBar
);

export const QueryBarComponentProvider = QueryBarComponentContext.Provider;

export const useQueryBarComponent = () => {
  return useContext(QueryBarComponentContext);
};

export function useQueryBarQuery() {
  const fields = useSelector((state) => {
    return state.queryBar.fields;
  });
  return useMemo(() => {
    return mapFormFieldsToQuery(fields);
  }, [fields]);
}

export function useChangeQueryBarQuery<T extends ChangeFilterEvent['type']>() {
  const store = useStore();
  return useCallback(
    (type: T, payload: Extract<ChangeFilterEvent, { type: T }>['payload']) => {
      store.dispatch(applyFilterChange({ type, payload } as ChangeFilterEvent));
    },
    [store]
  );
}
