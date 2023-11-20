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
import type Namespace from '../types/namespace';

const EmptyComponent: React.FunctionComponent = () => null;

const WorkspaceContent: React.FunctionComponent<{ namespace: Namespace }> = ({
  namespace,
}) => {
  const instanceTabs = useAppRegistryRole('Instance.Tab');
  const databaseTabs = useAppRegistryRole('Database.Tab');

  const Collection =
    useAppRegistryComponent('Collection.Workspace') ?? EmptyComponent;

  if (namespace.collection) {
    return <Collection></Collection>;
  }

  if (namespace.database) {
    return (
      <DatabaseTabsProvider tabs={databaseTabs ?? []}>
        <CompassDatabasePlugin />
      </DatabaseTabsProvider>
    );
  }

  return (
    <InstanceTabsProvider tabs={instanceTabs ?? []}>
      <InstanceWorkspacePlugin></InstanceWorkspacePlugin>
    </InstanceTabsProvider>
  );
};

export default WorkspaceContent;
