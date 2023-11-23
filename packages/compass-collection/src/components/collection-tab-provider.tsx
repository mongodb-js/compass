import React, { useContext, useRef } from 'react';
import type { CollectionTabPluginMetadata } from '../modules/collection-tab';

export interface CollectionTabPlugin {
  name: string;
  component: React.ComponentType<CollectionTabPluginMetadata>;
}

const CollectionTabsContext = React.createContext<CollectionTabPlugin[]>([]);

export const CollectionTabsProvider: React.FunctionComponent<{
  tabs: CollectionTabPlugin[];
}> = ({ tabs, children }) => {
  const tabsRef = useRef(tabs);
  return (
    <CollectionTabsContext.Provider value={tabsRef.current}>
      {children}
    </CollectionTabsContext.Provider>
  );
};

export function useCollectionTabPlugins(): CollectionTabPlugin[] {
  return useContext(CollectionTabsContext);
}
