/* eslint-disable react/prop-types */
import React from 'react';
import {
  AppRegistryComponents,
  useAppRegistryComponent,
} from '../contexts/app-registry-context';
import type Namespace from '../types/namespace';

const EmptyComponent: React.FunctionComponent = () => null;

const WorkspaceContent: React.FunctionComponent<{ namespace: Namespace }> = ({
  namespace,
}) => {
  const Collection =
    useAppRegistryComponent(AppRegistryComponents.COLLECTION_WORKSPACE) ??
    EmptyComponent;
  const Database =
    useAppRegistryComponent(AppRegistryComponents.DATABASE_WORKSPACE) ??
    EmptyComponent;
  const Instance =
    useAppRegistryComponent(AppRegistryComponents.INSTANCE_WORKSPACE) ??
    EmptyComponent;

  if (namespace.collection) {
    return <Collection></Collection>;
  }

  if (namespace.database) {
    return <Database></Database>;
  }

  return <Instance></Instance>;
};

export default WorkspaceContent;
