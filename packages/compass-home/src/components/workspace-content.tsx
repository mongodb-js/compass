/* eslint-disable react/prop-types */
import React from 'react';
import {
  useAppRegistryComponent,
  useAppRegistryRole,
} from 'hadron-app-registry';
import { CompassSchemaValidationPlugin } from '@mongodb-js/compass-schema-validation';
import MyQueriesPlugin from '@mongodb-js/compass-saved-aggregations-queries';
import { InstanceTab as DatabasesTabPlugin } from '@mongodb-js/compass-databases-collections';
import { InstanceTab as PerformanceTabPlugin } from '@mongodb-js/compass-serverstats';
import type Namespace from '../types/namespace';
import CollectionTabPlugin, {
  CollectionTabsProvider,
} from '@mongodb-js/compass-collection';
import { CompassAggregationsPlugin } from '@mongodb-js/compass-aggregations';
import WorkspacesPlugin, {
  WorkspacesProvider,
} from '@mongodb-js/compass-workspaces';

const WorkspaceContent: React.FunctionComponent<{ namespace: Namespace }> = ({
  // TODO: clean-up, this state is not needed here anymore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  namespace: _namespace,
}) => {
  const databaseTabs = useAppRegistryRole('Database.Tab');

  return (
    <WorkspacesProvider
      value={[
        MyQueriesPlugin,
        DatabasesTabPlugin,
        PerformanceTabPlugin,
        ...(databaseTabs ?? []),
        { name: 'Collection', component: CollectionTabPlugin },
      ]}
    >
      <CollectionTabsProvider
        tabs={[CompassSchemaValidationPlugin, CompassAggregationsPlugin]}
      >
        <WorkspacesPlugin
          initialTab={{ type: 'My Queries' }}
        ></WorkspacesPlugin>
      </CollectionTabsProvider>
    </WorkspacesProvider>
  );
};

export default WorkspaceContent;
