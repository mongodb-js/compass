import React, { useContext, useRef } from 'react';
import type { CollectionTabPluginMetadata } from '../modules/collection-tab';
import type { HadronPluginComponent } from 'hadron-app-registry';
import type { CollectionSubtab } from '@mongodb-js/compass-workspaces';

export interface CollectionTabPlugin {
  name: CollectionSubtab;
  Provider: HadronPluginComponent<CollectionTabPluginMetadata, any, any>;
  Content: React.FunctionComponent<CollectionTabPluginMetadata>;
  Header: React.FunctionComponent;
}

type CollectionTabComponentsProviderValue = {
  tabs: CollectionTabPlugin[];
  modals: CollectionTabPlugin['Content'][];
  queryBar: CollectionTabPlugin['Content'];
};

const defaultComponents: CollectionTabComponentsProviderValue = {
  tabs: [],
  modals: [],
  queryBar: (() => null) as any,
};

const CollectionTabComponentsContext =
  React.createContext<CollectionTabComponentsProviderValue>(defaultComponents);

export const CollectionTabsProvider: React.FunctionComponent<
  Partial<CollectionTabComponentsProviderValue>
> = ({ children, ...props }) => {
  const valueRef = useRef({ ...defaultComponents, ...props });
  return (
    <CollectionTabComponentsContext.Provider value={valueRef.current}>
      {children}
    </CollectionTabComponentsContext.Provider>
  );
};

export function useCollectionSubTabs() {
  return useContext(CollectionTabComponentsContext).tabs;
}

export function useCollectionScopedModals() {
  return useContext(CollectionTabComponentsContext).modals;
}

export function useCollectionQueryBar() {
  return useContext(CollectionTabComponentsContext).queryBar;
}
