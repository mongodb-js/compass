import { useCallback, useState } from 'react';
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
function getWorkspaceTabFromRoute(route: string): OpenWorkspaceOptions {
  const [, tab, namespace = '', subTab] = decodeURIComponent(route).split('/');
  if (tab === 'databases') {
    return { type: 'Databases' };
  }
  if (tab === 'collections' && namespace) {
    return { type: 'Collections', namespace };
  }
  if (tab === 'collection' && namespace) {
    return {
      type: 'Collection',
      namespace,
      initialSubtab: getCollectionSubTabFromRoute(subTab),
    };
  }
  return { type: 'Databases' };
}
export function useWorkspaceTabRouter() {
  const [currentTab, setCurrentTab] = useState<OpenWorkspaceOptions | null>(
    () => {
      return getWorkspaceTabFromRoute(window.location.pathname);
    }
  );
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
    setCurrentTab(tab);
  }, []);
  return [currentTab, updateCurrentTab] as const;
}
