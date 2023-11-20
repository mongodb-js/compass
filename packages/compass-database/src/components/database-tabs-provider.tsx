import React, { useContext, useMemo, useRef } from 'react';

export type DatabaseTab = {
  name: string;
  component: React.ComponentType;
};

const DatabaseTabsContext = React.createContext<DatabaseTab[]>([]);

export const DatabaseTabsProvider: React.FunctionComponent<{
  tabs: DatabaseTab[];
}> = ({ tabs, children }) => {
  const tabsRef = useRef(tabs);
  return (
    <DatabaseTabsContext.Provider value={tabsRef.current}>
      {children}
    </DatabaseTabsContext.Provider>
  );
};

export function useDatabaseTabs(
  filterFn: (tab: DatabaseTab) => boolean = () => true
): DatabaseTab[] {
  const tabs = useContext(DatabaseTabsContext);
  const filteredTabs = useMemo(() => {
    return tabs.filter(filterFn);
  }, [tabs, filterFn]);
  return filteredTabs;
}
