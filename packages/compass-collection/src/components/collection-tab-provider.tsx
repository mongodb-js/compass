import React, { useContext } from 'react';
import type { CollectionTabPluginMetadata } from '../modules/collection-tab';
import type { CompassPluginComponent } from '@mongodb-js/compass-app-registry';
import type { CollectionSubtab } from '@mongodb-js/compass-workspaces';
import { useInitialValue } from '@mongodb-js/compass-components';

export interface CollectionTabPlugin {
  name: CollectionSubtab;
  provider: CompassPluginComponent<CollectionTabPluginMetadata, any, any>;
  content: React.FunctionComponent<CollectionTabPluginMetadata>;
  header: React.FunctionComponent;
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
  const valueRef = useInitialValue({ ...defaultComponents, ...props });
  return (
    <CollectionTabComponentsContext.Provider value={valueRef}>
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
