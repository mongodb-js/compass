/* eslint-disable react/prop-types */
import React from 'react';
import {
  AppRegistryComponents,
  useAppRegistryComponent,
} from '../contexts/app-registry-context';
import type Namespace from '../types/namespace';
import { HadronPlugin } from 'hadron-app-registry';

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

  if (namespace.collection) {
    return <Collection></Collection>;
  }

  if (namespace.database) {
    return <Database></Database>;
  }

  return <HadronPlugin name="InstanceWorkspace"></HadronPlugin>;
};

export default WorkspaceContent;
