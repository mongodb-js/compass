import { useCallback, useState } from 'react';
import type {
  OpenWorkspaceOptions,
  WorkspaceTab,
} from '@mongodb-js/compass-workspaces';
import { getRouteFromWorkspaceTab, getWorkspaceTabFromRoute } from '../src';

export function useWorkspaceTabRouter() {
  const [currentTab, setCurrentTab] = useState<OpenWorkspaceOptions | null>(
    () => {
      return getWorkspaceTabFromRoute(window.location.pathname);
    }
  );

  const updateCurrentTab = useCallback((tab: WorkspaceTab | null) => {
    const newPath = getRouteFromWorkspaceTab(tab);
    window.history.replaceState(null, '', newPath);
    setCurrentTab(tab as any);
  }, []);
  return [currentTab, updateCurrentTab] as const;
}
