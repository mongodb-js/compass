import React from 'react';
import { registerHadronPlugin } from 'hadron-app-registry';
import { activatePlugin } from './stores/query-bar-store';
import type { DataServiceLocator } from 'mongodb-data-service/provider';
import { dataServiceLocator } from 'mongodb-data-service/provider';
import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';
import {
  QueryBarComponentProvider,
  useQueryBarComponent,
  useChangeQueryBarQuery,
  useQueryBarQuery,
} from './components/hooks';
import QueryBarComponent from './components/query-bar';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';
import { createFavoriteQueryStorageLocator } from '@mongodb-js/my-queries-storage/provider';

const QueryBarPlugin = registerHadronPlugin(
  {
    name: 'QueryBar',
    // Query bar is a special case where we render nothing for the purposes of
    // having a store set up. Connected QueryBar component is exported
    // separately and only renders if store is set up. This allows us to render
    // query bar as an actual component inside collection subtabs and share the
    // state between them
    component: function QueryBarStoreProvider({ children }) {
      return (
        <QueryBarComponentProvider value={QueryBarComponent}>
          {children}
        </QueryBarComponentProvider>
      );
    },
    activate: activatePlugin,
  },
  {
    dataService: dataServiceLocator as DataServiceLocator<
      'sample' | 'getConnectionString'
    >,
    instance: mongoDBInstanceLocator,
    preferences: preferencesLocator,
    logger: createLoggerAndTelemetryLocator('COMPASS-QUERY-BAR-UI'),
    locateFavoriteQueryStorage: createFavoriteQueryStorageLocator,
  }
);

export type ChangeQueryBar = typeof useChangeQueryBarQuery;

// Rendering query bar only makes sense if query bar store is in the rendering
// tree. If it's not, `useQueryBarComponent` will return a `null` component
export const QueryBar: React.FunctionComponent<
  React.ComponentProps<typeof QueryBarComponent>
> = (props) => {
  const Component = useQueryBarComponent();
  return <Component {...props}></Component>;
};

export default QueryBarPlugin;
export { useChangeQueryBarQuery, useQueryBarQuery };
