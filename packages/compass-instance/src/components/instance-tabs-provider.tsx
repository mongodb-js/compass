import React, { useContext, useMemo, useRef } from 'react';

export type InstanceTab = {
  name: string;
  component: React.ComponentType;
};

const InstanceTabsContext = React.createContext<InstanceTab[]>([]);

export const InstanceTabsProvider: React.FunctionComponent<{
  tabs: InstanceTab[];
}> = ({ tabs, children }) => {
  const tabsRef = useRef(tabs);
  return (
    <InstanceTabsContext.Provider value={tabsRef.current}>
      {children}
    </InstanceTabsContext.Provider>
  );
};

export function useInstanceTabs(
  activeTabName: string | null,
  filterFn: (tab: InstanceTab) => boolean = () => true
): [InstanceTab[], number] {
  const tabs = useContext(InstanceTabsContext);
  const filteredTabs = useMemo(() => {
    return tabs.filter(filterFn);
  }, [tabs, filterFn]);
  const activeTabId = useMemo(() => {
    return filteredTabs.findIndex((tab) => {
      return tab.name === activeTabName;
    });
  }, [filteredTabs, activeTabName]);
  return [filteredTabs, activeTabId === -1 ? 0 : activeTabId];
}
