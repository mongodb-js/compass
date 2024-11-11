import React from 'react';
import { registerHadronPlugin } from 'hadron-app-registry';
import { activatePlugin } from './stores/query-bar-store';
import {
  connectionInfoRefLocator,
  dataServiceLocator,
  type DataServiceLocator,
} from '@mongodb-js/compass-connections/provider';
import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';
import {
  QueryBarComponentProvider,
  useQueryBarComponent,
  useChangeQueryBarQuery,
  useQueryBarQuery,
  useLastAppliedQuery,
  useIsLastAppliedQueryOutdated,
  queryBarServiceLocator,
} from './components/hooks';
import type { QueryBarService } from './components/hooks';
import QueryBarComponent from './components/query-bar';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { atlasAiServiceLocator } from '@mongodb-js/compass-generative-ai/provider';
import {
  favoriteQueryStorageAccessLocator,
  recentQueryStorageAccessLocator,
} from '@mongodb-js/my-queries-storage/provider';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';

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
    logger: createLoggerLocator('COMPASS-QUERY-BAR-UI'),
    track: telemetryLocator,
    connectionInfoRef: connectionInfoRefLocator,
    atlasAiService: atlasAiServiceLocator,
    favoriteQueryStorageAccess: favoriteQueryStorageAccessLocator,
    recentQueryStorageAccess: recentQueryStorageAccessLocator,
  }
);

export type ChangeQueryFn = ReturnType<typeof useChangeQueryBarQuery>;

// Rendering query bar only makes sense if query bar store is in the rendering
// tree. If it's not, `useQueryBarComponent` will return a `null` component
export const QueryBar: React.FunctionComponent<
  React.ComponentProps<typeof QueryBarComponent>
> = (props) => {
  const Component = useQueryBarComponent();
  return <Component {...props}></Component>;
};

export default QueryBarPlugin;
export {
  useChangeQueryBarQuery,
  useQueryBarQuery,
  useLastAppliedQuery,
  useIsLastAppliedQueryOutdated,
  queryBarServiceLocator,
};
export type { QueryBarService };
export type { BaseQuery as Query } from './constants/query-properties';
