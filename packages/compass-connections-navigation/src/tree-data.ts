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
import { ConnectionStatus } from '@mongodb-js/compass-connections/provider';

type DatabaseOrCollectionStatus =
  | 'initial'
  | 'fetching'
  | 'refreshing'
  | 'ready'
  | 'error';

export type NotConnectedConnectionStatus =
  | 'initial'
  | 'connecting'
  | 'disconnected'
  | 'canceled'
  | 'failed';

export type NotConnectedConnection = {
  name: string;
  connectionInfo: ConnectionInfo;
  connectionStatus: NotConnectedConnectionStatus;
};

export type ConnectedConnection = {
  name: string;
  connectionInfo: ConnectionInfo;
  connectionStatus: 'connected';
  isReady: boolean;
  isDataLake: boolean;
  isWritable: boolean;
  isPerformanceTabSupported: boolean;
  isGenuineMongoDB: boolean;
  csfleMode?: 'enabled' | 'disabled' | 'unavailable';
  databasesStatus: DatabaseOrCollectionStatus;
  databasesLength: number;
  databases: Database[];
};

export type Connection = ConnectedConnection | NotConnectedConnection;

export type Database = {
  _id: string;
  name: string;
  collectionsStatus: DatabaseOrCollectionStatus;
  collectionsLength: number;
  collections: Collection[];
};

type PlaceholderTreeItem = VirtualPlaceholderItem & {
  colorCode?: string;
  id: string;
};

export type Collection = {
  _id: string;
  name: string;
  type: 'view' | 'collection' | 'timeseries';
  sourceName: string | null;
  pipeline: unknown[];
};

export type NotConnectedConnectionTreeItem = VirtualTreeItem & {
  name: string;
  type: 'connection';
  colorCode?: string;
  connectionInfo: ConnectionInfo;
  connectionStatus: NotConnectedConnectionStatus;
};

export type ConnectedConnectionTreeItem = VirtualTreeItem & {
  name: string;
  type: 'connection';
  colorCode?: string;
  isExpanded: boolean;
  connectionInfo: ConnectionInfo;
  connectionStatus: 'connected';
  isPerformanceTabSupported: boolean;
  hasWriteActionsDisabled: boolean;
  isShellEnabled: boolean;
  isGenuineMongoDB: boolean;
  csfleMode?: 'enabled' | 'disabled' | 'unavailable';
};

export type DatabaseTreeItem = VirtualTreeItem & {
  name: string;
  type: 'database';
  colorCode?: string;
  isExpanded: boolean;
  connectionId: string;
  dbName: string;
  hasWriteActionsDisabled: boolean;
};

export type CollectionTreeItem = VirtualTreeItem & {
  id: string;
  name: string;
  type: 'collection' | 'view' | 'timeseries';
  colorCode?: string;
  connectionId: string;
  namespace: string;
  hasWriteActionsDisabled: boolean;
};

export type SidebarActionableItem =
  | NotConnectedConnectionTreeItem
  | ConnectedConnectionTreeItem
  | DatabaseTreeItem
  | CollectionTreeItem;

export type SidebarTreeItem = PlaceholderTreeItem | SidebarActionableItem;

const notConnectedConnectionToItems = ({
  connection: { name, connectionInfo, connectionStatus },
  connectionIndex,
  connectionsLength,
}: {
  connection: NotConnectedConnection;
  connectionIndex: number;
  connectionsLength: number;
}): SidebarTreeItem[] => {
  return [
    {
      id: connectionInfo.id,
      level: 1,
      name,
      type: 'connection' as const,
      setSize: connectionsLength,
      posInSet: connectionIndex + 1,
      colorCode: connectionInfo.favorite?.color,
      connectionInfo,
      connectionStatus,
      isExpandable: true,
    },
  ];
};

const connectedConnectionToItems = ({
  connection: {
    connectionInfo,
    connectionStatus,
    name,
    databases,
    databasesStatus,
    databasesLength,
    isPerformanceTabSupported,
    isDataLake,
    isWritable,
    isGenuineMongoDB,
    csfleMode,
  },
  connectionIndex,
  connectionsLength,
  expandedItems = {},
  preferencesReadOnly,
  preferencesShellEnabled,
}: {
  connection: ConnectedConnection;
  connectionIndex: number;
  connectionsLength: number;
  expandedItems: Record<string, false | Record<string, boolean>>;
  preferencesReadOnly: boolean;
  preferencesShellEnabled: boolean;
}): SidebarTreeItem[] => {
  const isExpanded = !!expandedItems[connectionInfo.id];
  const colorCode = connectionInfo.favorite?.color;
  const hasWriteActionsDisabled =
    preferencesReadOnly || isDataLake || !isWritable;
  const connectionTI: ConnectedConnectionTreeItem = {
    id: connectionInfo.id,
    level: 1,
    name,
    type: 'connection' as const,
    setSize: connectionsLength,
    posInSet: connectionIndex + 1,
    isExpanded,
    isExpandable: true,
    colorCode,
    connectionInfo,
    connectionStatus,
    isPerformanceTabSupported,
    hasWriteActionsDisabled,
    isShellEnabled: preferencesShellEnabled,
    isGenuineMongoDB,
    csfleMode,
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
        databasesLength,
        databaseIndex,
        hasWriteActionsDisabled,
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
  databaseIndex,
  databasesLength,
  hasWriteActionsDisabled,
}: {
  database: Database;
  connectionId: string;
  expandedItems?: Record<string, boolean>;
  level: number;
  colorCode?: string;
  databaseIndex: number;
  databasesLength: number;
  hasWriteActionsDisabled: boolean;
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
    isExpandable: true,
    hasWriteActionsDisabled,
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
        id: `${connectionId}.${id}.placeholder.${index}`,
      }))
    );
  }

  return sidebarData.concat(
    collections.map(({ _id: id, name, type }, collectionIndex) => ({
      id: `${connectionId}.${id}`, // id is the namespace of the collection, so includes db as well
      level: level + 1,
      name,
      type,
      setSize: collectionsLength,
      posInSet: collectionIndex + 1,
      colorCode,
      connectionId,
      namespace: id,
      hasWriteActionsDisabled,
      isExpandable: false,
    }))
  );
};

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
export function getVirtualTreeItems({
  connections,
  isSingleConnection,
  expandedItems = {},
  preferencesReadOnly,
  preferencesShellEnabled,
}: {
  connections: (NotConnectedConnection | ConnectedConnection)[];
  isSingleConnection: boolean;
  expandedItems: Record<string, false | Record<string, boolean>>;
  preferencesReadOnly: boolean;
  preferencesShellEnabled: boolean;
}): SidebarTreeItem[] {
  if (!isSingleConnection) {
    return connections.flatMap((connection, connectionIndex) => {
      if (connection.connectionStatus === ConnectionStatus.Connected) {
        return connectedConnectionToItems({
          connection,
          expandedItems,
          connectionIndex,
          connectionsLength: connections.length,
          preferencesReadOnly,
          preferencesShellEnabled,
        });
      } else {
        return notConnectedConnectionToItems({
          connection,
          connectionsLength: connections.length,
          connectionIndex,
        });
      }
    });
  }

  const connection = connections[0];
  // In single connection mode we expect the only connection to be connected
  if (connection.connectionStatus !== ConnectionStatus.Connected) {
    return [];
  }

  const dbExpandedItems = expandedItems[connection.connectionInfo.id] || {};
  const hasWriteActionsDisabled =
    preferencesReadOnly || connection.isDataLake || !connection.isWritable;
  return connection.databases.flatMap((database, databaseIndex) => {
    return databaseToItems({
      connectionId: connection.connectionInfo.id,
      database,
      expandedItems: dbExpandedItems,
      level: 1,
      databasesLength: connection.databasesLength,
      databaseIndex,
      hasWriteActionsDisabled,
    });
  });
}
