import React, { useCallback, useMemo } from 'react';
import { registerHadronPlugin } from 'hadron-app-registry';
import { activatePlugin } from './stores/query-bar-store';
import type { DataServiceLocator } from 'mongodb-data-service/provider';
import { dataServiceLocator } from 'mongodb-data-service/provider';
import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';
import { useSelector, useStore } from './stores/context';
import { mapFormFieldsToQuery } from './utils/query';
import { applyFilterChange } from './stores/query-bar-reducer';
import type { ChangeFilterEvent } from './modules/change-filter';

const QueryBarPlugin = registerHadronPlugin(
  {
    name: 'QueryBar',
    // Query bar is a special case where we render nothing for the purposes of
    // having a store set up. Connected QueryBar component is exported
    // separately. This allows us to render query bar as an actual component
    // inside collection subtabs and share the state between them
    component: function QueryBarStoreProvider({ children }) {
      return <>{children}</>;
    },
    activate: activatePlugin,
  },
  {
    dataService: dataServiceLocator as DataServiceLocator<
      'sample' | 'getConnectionString'
    >,
    instance: mongoDBInstanceLocator,
  }
);

function activate(): void {
  // noop
}

function deactivate(): void {
  // noop
}

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

export type ChangeQueryBar = typeof useChangeQueryBarQuery;

export default QueryBarPlugin;
export { activate, deactivate };
export { default as metadata } from '../package.json';
export { default as QueryBar } from './components/query-bar';
