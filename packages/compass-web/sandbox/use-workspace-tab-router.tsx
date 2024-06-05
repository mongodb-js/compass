import { useCallback, useEffect, useState } from 'react';
import type {
  OpenWorkspaceOptions,
  CollectionSubtab,
  WorkspaceTab,
} from '@mongodb-js/compass-workspaces';

function getCollectionSubTabFromRoute(subTab?: string): CollectionSubtab {
  switch (subTab?.toLowerCase() ?? '') {
    case 'schema':
      return 'Schema';
    case 'indexes':
      return 'Indexes';
    case 'aggregations':
      return 'Aggregations';
    case 'validation':
      return 'Validation';
    default:
      return 'Documents';
  }
}

type AllowedInitialWorkspaceTabs = Extract<
  OpenWorkspaceOptions,
  { type: 'Databases' | 'Collections' | 'Collection' }
>;

function getWorkspaceTabFromRoute(
  route: string,
  connectionId: string | undefined
): AllowedInitialWorkspaceTabs | null {
  const [, tab, namespace = '', subTab] = decodeURIComponent(route).split('/');
  if (!connectionId) {
    return null;
  }
  if (tab === 'databases') {
    return { type: 'Databases', connectionId };
  }
  if (tab === 'collections' && namespace) {
    return { type: 'Collections', connectionId, namespace };
  }
  if (tab === 'collection' && namespace) {
    return {
      type: 'Collection',
      connectionId,
      namespace,
      initialSubtab: getCollectionSubTabFromRoute(subTab),
    };
  }
  return { type: 'Databases', connectionId };
}

export function useWorkspaceTabRouter(connectionId: string | undefined) {
  const [currentTab, setCurrentTab] =
    useState<AllowedInitialWorkspaceTabs | null>(() => {
      return getWorkspaceTabFromRoute(window.location.pathname, connectionId);
    });

  useEffect(() => {
    setCurrentTab(
      getWorkspaceTabFromRoute(window.location.pathname, connectionId)
    );
  }, [connectionId]);

  const updateCurrentTab = useCallback((tab: WorkspaceTab | null) => {
    let newPath: string;
    switch (tab?.type) {
      case 'Databases':
        newPath = '/databases';
        break;
      case 'Collections':
        newPath = `/collections/${encodeURIComponent(tab.namespace)}`;
        break;
      case 'Collection':
        newPath = `/collection/${encodeURIComponent(
          tab.namespace
        )}/${tab.subTab.toLowerCase()}`;
        break;
      default:
        newPath = '/';
    }
    window.history.replaceState(null, '', newPath);
    setCurrentTab(tab as any);
  }, []);
  return [currentTab, updateCurrentTab] as const;
}
