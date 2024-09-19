import React, { useContext, useRef } from 'react';
import type { CollectionTabPluginMetadata } from '../modules/collection-tab';
import type { HadronPluginComponent } from 'hadron-app-registry';
import type { CollectionSubtab } from '@mongodb-js/compass-workspaces';

export interface CollectionTabPlugin {
  name: CollectionSubtab;
  provider: HadronPluginComponent<CollectionTabPluginMetadata, any, any>;
  content: React.FunctionComponent<CollectionTabPluginMetadata>;
  header: React.FunctionComponent<CollectionTabPluginMetadata>;
}

type CollectionTabComponentsProviderValue = {
  tabs: CollectionTabPlugin[];
  modals: CollectionTabPlugin['content'][];
  queryBar: CollectionTabPlugin['content'];
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
