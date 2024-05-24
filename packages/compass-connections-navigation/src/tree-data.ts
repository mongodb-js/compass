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

export type SidebarTreeItem =
  | PlaceholderTreeItem
  | ConnectionTreeItem
  | DatabaseTreeItem
  | CollectionTreeItem;

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
  expandedItems = {},
}: {
  connection: Connection;
  maxNestingLevel: number;
  expandedItems: Record<string, false | Record<string, boolean>>;
}): SidebarTreeItem[] => {
  const isExpanded = !!expandedItems[connectionInfo.id];
  const colorCode = connectionInfo.favorite?.color;
  const connectionTI: ConnectionTreeItem = {
    id: connectionInfo.id,
    level: 1,
    name,
    type: 'connection' as const,
    setSize: 0,
    posInSet: 0,
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
      Array.from({ length: placeholdersLength }, () => ({
        level: 2,
        type: 'placeholder' as const,
        colorCode,
        maxNestingLevel,
      }))
    );
  }

  return sidebarData.concat(
    databases.flatMap((database) => {
      return databaseToItems({
        connectionId: connectionInfo.id,
        database,
        expandedItems: expandedItems[connectionInfo.id] || {},
        level: 2,
        colorCode,
        maxNestingLevel,
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
}: {
  database: Database;
  connectionId: string;
  expandedItems?: Record<string, boolean>;
  level: number;
  colorCode?: string;
  maxNestingLevel: number;
}): SidebarTreeItem[] => {
  const isExpanded = !!expandedItems[id];
  const databaseTI: DatabaseTreeItem = {
    id: `${connectionId}.${id}`,
    level,
    name,
    type: 'database' as const,
    setSize: 0,
    posInSet: 0,
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
      Array.from({ length: placeholdersLength }, () => ({
        level: level + 1,
        type: 'placeholder' as const,
        colorCode,
        maxNestingLevel,
      }))
    );
  }

  return sidebarData.concat(
    collections.map(({ _id: id, name, type }) => ({
      id: `${connectionId}.${id}`, // id is the namespace of the collection, so includes db as well
      level: level + 1,
      name,
      type: type as 'collection' | 'view' | 'timeseries',
      setSize: 0,
      posInSet: 0,
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
  let treeList: SidebarTreeItem[] = [];
  if (!isSingleConnection) {
    treeList = connections.flatMap((connection) =>
      connectionToItems({
        connection,
        expandedItems,
        maxNestingLevel: getMaxNestingLevel(isSingleConnection),
      })
    );
  } else {
    const connection = connections[0];
    const dbExpandedItems = expandedItems[connection.connectionInfo.id] || {};
    treeList = connection.databases.flatMap((database) => {
      return databaseToItems({
        connectionId: connection.connectionInfo.id,
        database,
        expandedItems: dbExpandedItems,
        level: 1,
        maxNestingLevel: getMaxNestingLevel(isSingleConnection),
      });
    });
  }

  // While generating a flat list of tree items, its is not possible to know the exact number
  // of items in the list. So we will generate the list first and then map it to have correct setSize and posInSet.
  const setSize = treeList.length;
  return treeList.map((item, index) => {
    const posInSet = index + 1;
    return {
      ...item,
      setSize,
      posInSet,
    };
  });
}
