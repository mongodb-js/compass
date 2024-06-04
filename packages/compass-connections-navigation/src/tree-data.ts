import type { ConnectionInfo } from '@mongodb-js/connection-info';
import {
  MAX_COLLECTION_PLACEHOLDER_ITEMS,
  MAX_DATABASE_PLACEHOLDER_ITEMS,
  MIN_DATABASE_PLACEHOLDER_ITEMS,
} from './constants';
import type {
  VirtualPlaceholderItem,
  VirtualTreeItem,
} from './virtual-list/use-virtual-navigation-tree';

type Collection = {
  _id: string;
  name: string;
  type: string;
};

type Status = 'initial' | 'fetching' | 'refreshing' | 'ready' | 'error';

type Database = {
  _id: string;
  name: string;
  collectionsStatus: Status;
  collectionsLength: number;
  collections: Collection[];
};

export type Connection = {
  connectionInfo: ConnectionInfo;
  name: string;
  databasesStatus: Status;
  databasesLength: number;
  databases: Database[];
  isReady: boolean;
  isDataLake: boolean;
  isWritable: boolean;
  isPerformanceTabSupported: boolean;
};

type PlaceholderTreeItem = VirtualPlaceholderItem & {
  colorCode?: string;
  id: string;
  maxNestingLevel: number;
};

export type ConnectionTreeItem = VirtualTreeItem & {
  name: string;
  type: 'connection';
  colorCode?: string;
  isExpanded: boolean;
  connectionInfo: ConnectionInfo;
  isPerformanceTabSupported: boolean;
  maxNestingLevel: number;
};

export type DatabaseTreeItem = VirtualTreeItem & {
  name: string;
  type: 'database';
  colorCode?: string;
  isExpanded: boolean;
  connectionId: string;
  dbName: string;
  maxNestingLevel: number;
};

export type CollectionTreeItem = VirtualTreeItem & {
  id: string;
  name: string;
  type: 'collection' | 'view' | 'timeseries';
  colorCode?: string;
  connectionId: string;
  namespace: string;
  maxNestingLevel: number;
};

export type SidebarActionableItem =
  | ConnectionTreeItem
  | DatabaseTreeItem
  | CollectionTreeItem;

export type SidebarTreeItem = PlaceholderTreeItem | SidebarActionableItem;

const connectionToItems = ({
  connection: {
    connectionInfo,
    name,
    databases,
    databasesStatus,
    databasesLength,
    isPerformanceTabSupported,
  },
  maxNestingLevel,
  connectionIndex,
  connectionsLength,
  expandedItems = {},
}: {
  connection: Connection;
  maxNestingLevel: number;
  connectionIndex: number;
  connectionsLength: number;
  expandedItems: Record<string, false | Record<string, boolean>>;
}): SidebarTreeItem[] => {
  const isExpanded = !!expandedItems[connectionInfo.id];
  const colorCode = connectionInfo.favorite?.color;
  const connectionTI: ConnectionTreeItem = {
    id: connectionInfo.id,
    level: 1,
    name,
    type: 'connection' as const,
    setSize: connectionsLength,
    posInSet: connectionIndex + 1,
    isExpanded,
    colorCode,
    connectionInfo,
    isPerformanceTabSupported,
    maxNestingLevel,
  };

  const sidebarData: SidebarTreeItem[] = [connectionTI];
  if (!isExpanded) {
    return sidebarData;
  }

  const areDatabasesReady = ['ready', 'refreshing', 'error'].includes(
    databasesStatus
  );
  const placeholdersLength = Math.max(
    Math.min(databasesLength, MAX_DATABASE_PLACEHOLDER_ITEMS),
    // we are connecting and we don't have metadata on how many databases are in this cluster
    MIN_DATABASE_PLACEHOLDER_ITEMS
  );

  if (!areDatabasesReady) {
    return sidebarData.concat(
      Array.from({ length: placeholdersLength }, (_, index) => ({
        level: 2,
        type: 'placeholder' as const,
        colorCode,
        maxNestingLevel,
        id: `${connectionInfo.id}.placeholder.${index}`,
      }))
    );
  }

  return sidebarData.concat(
    databases.flatMap((database, databaseIndex) => {
      return databaseToItems({
        connectionId: connectionInfo.id,
        database,
        expandedItems: expandedItems[connectionInfo.id] || {},
        level: 2,
        colorCode,
        maxNestingLevel,
        databasesLength,
        databaseIndex,
      });
    })
  );
};

const databaseToItems = ({
  database: {
    _id: id,
    name,
    collections,
    collectionsLength,
    collectionsStatus,
  },
  connectionId,
  expandedItems = {},
  level,
  colorCode,
  maxNestingLevel,
  databaseIndex,
  databasesLength,
}: {
  database: Database;
  connectionId: string;
  expandedItems?: Record<string, boolean>;
  level: number;
  colorCode?: string;
  maxNestingLevel: number;
  databaseIndex: number;
  databasesLength: number;
}): SidebarTreeItem[] => {
  const isExpanded = !!expandedItems[id];
  const databaseTI: DatabaseTreeItem = {
    id: `${connectionId}.${id}`,
    level,
    name,
    type: 'database' as const,
    setSize: databasesLength,
    posInSet: databaseIndex + 1,
    isExpanded,
    colorCode,
    connectionId,
    dbName: id,
    maxNestingLevel,
  };

  const sidebarData: SidebarTreeItem[] = [databaseTI];
  if (!isExpanded) {
    return sidebarData;
  }

  const areCollectionsReady = ['ready', 'refreshing', 'error'].includes(
    collectionsStatus
  );
  const placeholdersLength = Math.min(
    collectionsLength,
    MAX_COLLECTION_PLACEHOLDER_ITEMS
  );

  if (!areCollectionsReady) {
    return sidebarData.concat(
      Array.from({ length: placeholdersLength }, (_, index) => ({
        level: level + 1,
        type: 'placeholder' as const,
        colorCode,
        maxNestingLevel,
        id: `${connectionId}.${id}.placeholder.${index}`,
      }))
    );
  }

  return sidebarData.concat(
    collections.map(({ _id: id, name, type }, collectionIndex) => ({
      id: `${connectionId}.${id}`, // id is the namespace of the collection, so includes db as well
      level: level + 1,
      name,
      type: type as 'collection' | 'view' | 'timeseries',
      setSize: collectionsLength,
      posInSet: collectionIndex + 1,
      colorCode,
      connectionId,
      namespace: id,
      maxNestingLevel,
    }))
  );
};

export function getMaxNestingLevel(isSingleConnection: boolean): number {
  return isSingleConnection ? 2 : 3;
}

/**
 * Converts a list connections to virtual tree items.
 *
 * When isSingleConnection is true, the connections are treated as a single connection mode
 * and only two levels of items are shown: databases and collections.
 *
 * The IDs of the items are just to be used by the tree to correctly identify the items and
 * do not represent the actual IDs of the items.
 *
 * @param connections - The connections.
 * @param isSingleConnection - Whether the connections are a single connection.
 * @param expandedItems - The expanded items.
 */
export function getVirtualTreeItems(
  connections: Connection[],
  isSingleConnection: boolean,
  expandedItems: Record<string, false | Record<string, boolean>> = {}
): SidebarTreeItem[] {
  if (!isSingleConnection) {
    return connections.flatMap((connection, connectionIndex) =>
      connectionToItems({
        connection,
        expandedItems,
        maxNestingLevel: getMaxNestingLevel(isSingleConnection),
        connectionIndex,
        connectionsLength: connections.length,
      })
    );
  }

  const connection = connections[0];
  const dbExpandedItems = expandedItems[connection.connectionInfo.id] || {};
  return connection.databases.flatMap((database, databaseIndex) => {
    return databaseToItems({
      connectionId: connection.connectionInfo.id,
      database,
      expandedItems: dbExpandedItems,
      level: 1,
      maxNestingLevel: getMaxNestingLevel(isSingleConnection),
      databasesLength: connection.databasesLength,
      databaseIndex,
    });
  });
}
