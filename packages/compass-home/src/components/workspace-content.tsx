/* eslint-disable react/prop-types */
import React from 'react';
import { useAppRegistryComponent } from 'hadron-app-registry';
import type Namespace from '../types/namespace';

const EmptyComponent: React.FunctionComponent = () => null;

const WorkspaceContent: React.FunctionComponent<{ namespace: Namespace }> = ({
  namespace,
}) => {
  const Collection =
    useAppRegistryComponent('Collection.Workspace') ?? EmptyComponent;
  const Database =
    useAppRegistryComponent('Database.Workspace') ?? EmptyComponent;
  const Instance =
    useAppRegistryComponent('Instance.Workspace') ?? EmptyComponent;

  if (namespace.collection) {
    return <Collection></Collection>;
  }

  if (namespace.database) {
    return <Database></Database>;
  }

  return <Instance></Instance>;
};

export default WorkspaceContent;
