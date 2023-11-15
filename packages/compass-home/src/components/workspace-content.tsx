/* eslint-disable react/prop-types */
import React from 'react';
import {
  useAppRegistryComponent,
  useAppRegistryRole,
} from 'hadron-app-registry';
import InstanceWorkspacePlugin, {
  InstanceTabsProvider,
} from '@mongodb-js/compass-instance';
import type Namespace from '../types/namespace';

const EmptyComponent: React.FunctionComponent = () => null;

const WorkspaceContent: React.FunctionComponent<{ namespace: Namespace }> = ({
  namespace,
}) => {
  const instanceTabs = useAppRegistryRole('Instance.Tab');

  const Collection =
    useAppRegistryComponent('Collection.Workspace') ?? EmptyComponent;
  const Database =
    useAppRegistryComponent('Database.Workspace') ?? EmptyComponent;

  if (namespace.collection) {
    return <Collection></Collection>;
  }

  if (namespace.database) {
    return <Database></Database>;
  }

  return (
    <InstanceTabsProvider tabs={instanceTabs ?? []}>
      <InstanceWorkspacePlugin></InstanceWorkspacePlugin>
    </InstanceTabsProvider>
  );
};

export default WorkspaceContent;
