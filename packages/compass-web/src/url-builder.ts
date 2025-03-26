import type {
  CollectionSubtab,
  OpenWorkspaceOptions,
  WorkspaceTab,
} from '@mongodb-js/compass-workspaces';
import toNS from 'mongodb-ns';

/**
 * This is specifically mapping from existing data explorer route params to
 * compass types, hence some routes not exactly matching the tab names
 */
function getCollectionSubTabFromRoute(
  routeSubTab: string | undefined
): CollectionSubtab | undefined {
  switch (routeSubTab) {
    case 'find':
      return 'Documents';
    case 'aggregation':
      return 'Aggregations';
    case 'schema':
      return 'Schema';
    case 'indexes':
      return 'Indexes';
    case 'validation':
      return 'Validation';
    case 'global-writes':
      return 'GlobalWrites';
    case 'schema-viz':
      return 'SchemaVizualization';
    default:
      return undefined;
  }
}

function getRouteFromCollectionSubTab(subTab: CollectionSubtab): string {
  switch (subTab) {
    case 'Documents':
      return 'find';
    case 'Aggregations':
      return 'aggregation';
    case 'Schema':
      return 'schema';
    case 'Indexes':
      return 'indexes';
    case 'Validation':
      return 'validation';
    case 'GlobalWrites':
      return 'global-writes';
    default:
      return '';
  }
}

export function getWorkspaceTabFromRoute(
  route: string
): OpenWorkspaceOptions | null {
  const [, connectionId, db, coll, subTab] =
    decodeURIComponent(route).split('/');

  if (connectionId && db && coll) {
    const maybeSubTab = getCollectionSubTabFromRoute(subTab);
    return {
      type: 'Collection',
      connectionId,
      namespace: `${db}.${coll}`,
      ...(maybeSubTab && { initialSubtab: maybeSubTab }),
    };
  }
  if (connectionId && db) {
    return { type: 'Collections', connectionId, namespace: db };
  }
  if (connectionId) {
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
      .filter(Boolean)
      .join('/')
  );
}

export function getRouteFromWorkspaceTab(tab: WorkspaceTab | null) {
  let route: string;
  switch (tab?.type) {
    case 'Databases':
      route = buildAbsoluteURL(tab.connectionId);
      break;
    case 'Collections': {
      route = buildAbsoluteURL(tab.connectionId, tab.namespace);
      break;
    }
    case 'Collection': {
      const { database, collection } = toNS(tab.namespace);
      route = buildAbsoluteURL(
        tab.connectionId,
        database,
        collection,
        getRouteFromCollectionSubTab(tab.subTab)
      );
      break;
    }
    default:
      route = '/';
  }
  return route;
}
