/* eslint-disable react/prop-types */
import React from 'react';
import {
  useAppRegistryComponent,
  useAppRegistryRole,
} from 'hadron-app-registry';
import InstanceWorkspacePlugin, {
  InstanceTabsProvider,
} from '@mongodb-js/compass-instance';
import {
  CompassDatabasePlugin,
  DatabaseTabsProvider,
} from '@mongodb-js/compass-database';
import { CompassSchemaValidationPlugin } from '@mongodb-js/compass-schema-validation';
import CompassSavedAggregationsQueriesPlugin from '@mongodb-js/compass-saved-aggregations-queries';
import { InstanceTab as DatabasesTabPlugin } from '@mongodb-js/compass-databases-collections';
import { InstanceTab as PerformanceTabPlugin } from '@mongodb-js/compass-serverstats';
import type Namespace from '../types/namespace';
import { CollectionTabsProvider } from '@mongodb-js/compass-collection';
import { CompassAggregationsPlugin } from '@mongodb-js/compass-aggregations';

const EmptyComponent: React.FunctionComponent = () => null;

const WorkspaceContent: React.FunctionComponent<{ namespace: Namespace }> = ({
  namespace,
}) => {
  const databaseTabs = useAppRegistryRole('Database.Tab');

  const Collection =
    useAppRegistryComponent('Collection.Workspace') ?? EmptyComponent;

  if (namespace.collection) {
    return (
      <CollectionTabsProvider
        tabs={[CompassSchemaValidationPlugin, CompassAggregationsPlugin]}
      >
        <Collection />
      </CollectionTabsProvider>
    );
  }

  if (namespace.database) {
    return (
      <DatabaseTabsProvider tabs={databaseTabs ?? []}>
        <CompassDatabasePlugin />
      </DatabaseTabsProvider>
    );
  }

  return (
    <InstanceTabsProvider
      tabs={[
        CompassSavedAggregationsQueriesPlugin,
        DatabasesTabPlugin,
        PerformanceTabPlugin,
      ]}
    >
      <InstanceWorkspacePlugin></InstanceWorkspacePlugin>
    </InstanceTabsProvider>
  );
};

export default WorkspaceContent;
