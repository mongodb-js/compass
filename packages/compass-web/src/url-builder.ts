import type {
  CollectionSubtab,
  OpenWorkspaceOptions,
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

export function getWorkspaceTabFromRoute(
  route: string
): OpenWorkspaceOptions | null {
  const [, connectionId, tab, namespace = '', subTab] =
    decodeURIComponent(route).split('/');

  if (namespace) {
    if (tab === 'collection') {
      return {
        type: 'Collection',
        connectionId,
        namespace,
        initialSubtab: getCollectionSubTabFromRoute(subTab),
      };
    }
    if (tab === 'collections') {
      return { type: 'Collections', connectionId, namespace };
    }
  }
  if (connectionId && (tab === 'databases' || !tab)) {
    return { type: 'Databases', connectionId };
  }
  return { type: 'Welcome' };
}

function buildAbsoluteURL(...parts: string[]) {
  return (
    '/' +
    parts
      .map((part) => {
        return encodeURIComponent(part);
      })
      .join('/')
  );
}

export function getRouteFromWorkspaceTab(tab: WorkspaceTab | null) {
  let route: string;
  switch (tab?.type) {
    case 'Databases':
      route = buildAbsoluteURL(tab.connectionId, 'databases');
      break;
    case 'Collections':
      route = buildAbsoluteURL(tab.connectionId, 'collections', tab.namespace);
      break;
    case 'Collection':
      route = buildAbsoluteURL(
        tab.connectionId,
        'collection',
        tab.namespace,
        tab.subTab.toLowerCase()
      );
      break;
    default:
      route = '/';
  }
  return route;
}
