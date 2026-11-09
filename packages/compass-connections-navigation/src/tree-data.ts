import type { ConnectionInfo } from '@mongodb-js/connection-info';
import type { Folder } from '@mongodb-js/connection-storage/provider';
import { ConnectionStatus } from '@mongodb-js/compass-connections/provider';
import {
  MAX_COLLECTION_PLACEHOLDER_ITEMS,
  MAX_DATABASE_PLACEHOLDER_ITEMS,
  MIN_DATABASE_PLACEHOLDER_ITEMS,
} from './constants';
import type {
  VirtualPlaceholderItem,
  VirtualTreeItem,
} from './virtual-list/use-virtual-navigation-tree';

type DatabaseOrCollectionStatus =
  'initial' | 'fetching' | 'refreshing' | 'ready' | 'error';

export type NotConnectedConnectionStatus =
  'initial' | 'connecting' | 'disconnected' | 'canceled' | 'failed';

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
  isPerformanceTabAvailable: boolean;
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
  inferredFromPrivileges: boolean;
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
  inferredFromPrivileges: boolean;
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
  isPerformanceTabAvailable: boolean;
  isPerformanceTabSupported: boolean;
  hasWriteActionsDisabled: boolean;
  isShellEnabled: boolean;
  isGenuineMongoDB: boolean;
  csfleMode?: 'enabled' | 'disabled' | 'unavailable';
};

export type FolderTreeItem = VirtualTreeItem & {
  name: string;
  type: 'folder';
  folderId: string;
  colorCode?: string;
};

export type DatabaseTreeItem = VirtualTreeItem & {
  name: string;
  type: 'database';
  colorCode?: string;
  isExpanded: boolean;
  connectionId: string;
  connectionItem: ConnectedConnectionTreeItem;
  dbName: string;
  hasWriteActionsDisabled: boolean;
  canDeleteDatabase: boolean;
  inferredFromPrivileges: boolean;
};

export type CollectionTreeItem = VirtualTreeItem & {
  id: string;
  name: string;
  type: 'collection' | 'view' | 'timeseries';
  colorCode?: string;
  connectionId: string;
  databaseItem: DatabaseTreeItem;
  namespace: string;
  hasWriteActionsDisabled: boolean;
  canEditCollection: boolean;
  inferredFromPrivileges: boolean;
};

export type SidebarActionableItem =
  | FolderTreeItem
  | NotConnectedConnectionTreeItem
  | ConnectedConnectionTreeItem
  | DatabaseTreeItem
  | CollectionTreeItem;

export type SidebarTreeItem = PlaceholderTreeItem | SidebarActionableItem;

/**
 * Returns the id of the connection an item belongs to, or `null` for items that
 * are not tied to a connection (folders and placeholders).
 */
export function getConnectionId(item: SidebarTreeItem): string | null {
  if (item.type === 'placeholder' || item.type === 'folder') {
    return null;
  } else if (item.type === 'connection') {
    return item.connectionInfo.id;
  } else {
    return item.connectionId;
  }
}

const notConnectedConnectionToItems = ({
  connection: { name, connectionInfo, connectionStatus },
  level,
  setSize,
  posInSet,
}: {
  connection: NotConnectedConnection;
  level: number;
  setSize: number;
  posInSet: number;
}): SidebarTreeItem[] => {
  return [
    {
      id: connectionInfo.id,
      level,
      name,
      type: 'connection' as const,
      setSize,
      posInSet,
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
    isPerformanceTabAvailable,
    isPerformanceTabSupported,
    isDataLake,
    isWritable,
    isGenuineMongoDB,
    csfleMode,
  },
  level,
  setSize,
  posInSet,
  expandedItems = {},
  preferencesReadOnly,
  preferencesReadWrite,
  preferencesShellEnabled,
}: {
  connection: ConnectedConnection;
  level: number;
  setSize: number;
  posInSet: number;
  expandedItems: Record<string, false | Record<string, boolean>>;
  preferencesReadOnly: boolean;
  preferencesReadWrite: boolean;
  preferencesShellEnabled: boolean;
}): SidebarTreeItem[] => {
  const isExpanded = !!expandedItems[connectionInfo.id];
  const colorCode = connectionInfo.favorite?.color;
  const hasWriteActionsDisabled =
    preferencesReadOnly || isDataLake || !isWritable;
  const connectionTI: ConnectedConnectionTreeItem = {
    id: connectionInfo.id,
    level,
    name,
    type: 'connection' as const,
    setSize,
    posInSet,
    isExpanded,
    isExpandable: true,
    colorCode,
    connectionInfo,
    connectionStatus,
    isPerformanceTabAvailable,
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
        level: level + 1,
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
        connectionItem: connectionTI,
        database,
        expandedItems: expandedItems[connectionInfo.id] || {},
        level: level + 1,
        colorCode,
        databasesLength,
        databaseIndex,
        hasWriteActionsDisabled,
        canDeleteDatabase: !preferencesReadWrite,
        canEditCollection: !preferencesReadWrite,
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
    inferredFromPrivileges,
  },
  connectionId,
  connectionItem,
  expandedItems = {},
  level,
  colorCode,
  databaseIndex,
  databasesLength,
  hasWriteActionsDisabled,
  canDeleteDatabase,
  canEditCollection,
}: {
  database: Database;
  connectionId: string;
  connectionItem: ConnectedConnectionTreeItem;
  expandedItems?: Record<string, boolean>;
  level: number;
  colorCode?: string;
  databaseIndex: number;
  databasesLength: number;
  hasWriteActionsDisabled: boolean;
  canDeleteDatabase: boolean;
  canEditCollection: boolean;
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
    connectionItem,
    dbName: id,
    isExpandable: true,
    hasWriteActionsDisabled,
    inferredFromPrivileges,
    canDeleteDatabase,
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
    collections.map(
      ({ _id: id, name, type, inferredFromPrivileges }, collectionIndex) => ({
        id: `${connectionId}.${id}`, // id is the namespace of the collection, so includes db as well
        level: level + 1,
        name,
        type,
        setSize: collectionsLength,
        posInSet: collectionIndex + 1,
        colorCode,
        connectionId,
        databaseItem: databaseTI,
        namespace: id,
        hasWriteActionsDisabled,
        isExpandable: false,
        inferredFromPrivileges,
        canEditCollection,
      })
    )
  );
};

const connectionToItems = ({
  connection,
  level,
  setSize,
  posInSet,
  expandedItems,
  preferencesReadOnly,
  preferencesReadWrite,
  preferencesShellEnabled,
}: {
  connection: Connection;
  level: number;
  setSize: number;
  posInSet: number;
  expandedItems: Record<string, false | Record<string, boolean>>;
  preferencesReadOnly: boolean;
  preferencesReadWrite: boolean;
  preferencesShellEnabled: boolean;
}): SidebarTreeItem[] => {
  if (connection.connectionStatus === ConnectionStatus.Connected) {
    return connectedConnectionToItems({
      connection,
      level,
      setSize,
      posInSet,
      expandedItems,
      preferencesReadOnly,
      preferencesReadWrite,
      preferencesShellEnabled,
    });
  } else {
    return notConnectedConnectionToItems({
      connection,
      level,
      setSize,
      posInSet,
    });
  }
};

type TopLevelEntry =
  | { type: 'folder'; folder: Folder; connections: Connection[] }
  | { type: 'connection'; connection: Connection };

/**
 * Favorites first, then by display name, then by id so connections sharing a
 * name keep a stable order. Mirrors the ordering the connections store applies,
 * so the tree renders the same order whether or not the list it is given is
 * already sorted.
 */
function compareConnections(a: Connection, b: Connection): number {
  const aIsFavorite = a.connectionInfo.savedConnectionType === 'favorite';
  const bIsFavorite = b.connectionInfo.savedConnectionType === 'favorite';
  if (aIsFavorite !== bIsFavorite) {
    return aIsFavorite ? -1 : 1;
  }
  return (
    a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase()) ||
    a.connectionInfo.id.localeCompare(b.connectionInfo.id)
  );
}

/**
 * Splits the connections into the ones filed under a folder and the ones that
 * stay uncategorized. Membership is resolved from the assignments, so a
 * connection whose assignment points at a folder that doesn't exist is
 * uncategorized rather than dropped.
 */
function groupConnectionsByFolder(
  connections: Connection[],
  folders: Folder[],
  folderAssignments: Record<string, string>
): TopLevelEntry[] {
  const foldersById = new Map(folders.map((folder) => [folder.id, folder]));
  const connectionsByFolderId = new Map<string, Connection[]>();
  const uncategorized: Connection[] = [];

  // Sorting once before splitting is enough: the split preserves relative
  // order, so each folder's connections and the uncategorized ones all come out
  // ordered.
  for (const connection of connections.slice().sort(compareConnections)) {
    const folderId = folderAssignments[connection.connectionInfo.id];
    if (!folderId || !foldersById.has(folderId)) {
      uncategorized.push(connection);
      continue;
    }
    const siblings = connectionsByFolderId.get(folderId);
    if (siblings) {
      siblings.push(connection);
    } else {
      connectionsByFolderId.set(folderId, [connection]);
    }
  }

  const sortedFolders = folders
    .slice()
    .sort((a, b) =>
      a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase())
    );

  return [
    ...sortedFolders.map((folder): TopLevelEntry => ({
      type: 'folder',
      folder,
      connections: connectionsByFolderId.get(folder.id) ?? [],
    })),
    ...uncategorized.map((connection): TopLevelEntry => ({
      type: 'connection',
      connection,
    })),
  ];
}

/**
 * Converts a list of connections to virtual tree items, grouped under folders.
 *
 * The IDs of the items are just to be used by the tree to correctly identify the items and
 * do not represent the actual IDs of the items.
 *
 * Folders are ordered alphabetically, each followed by its connections one
 * level deeper. Within a folder, and among the uncategorized connections,
 * favorites come first and everything is ordered by display name.
 *
 * @param connections - The connections.
 * @param folders - The folders to group the connections under.
 * @param folderAssignments - Maps a connection id to the folder id it belongs to.
 * @param expandedItems - The expanded items, keyed by connection or folder id.
 */
export function getVirtualTreeItems({
  connections,
  folders = [],
  folderAssignments = {},
  expandedItems = {},
  preferencesReadOnly,
  preferencesReadWrite,
  preferencesShellEnabled,
}: {
  connections: (NotConnectedConnection | ConnectedConnection)[];
  folders?: Folder[];
  folderAssignments?: Record<string, string>;
  expandedItems: Record<string, false | Record<string, boolean>>;
  preferencesReadOnly: boolean;
  preferencesReadWrite: boolean;
  preferencesShellEnabled: boolean;
}): SidebarTreeItem[] {
  const topLevel = groupConnectionsByFolder(
    connections,
    folders,
    folderAssignments
  );
  const setSize = topLevel.length;

  return topLevel.flatMap((entry, index) => {
    const posInSet = index + 1;

    if (entry.type === 'connection') {
      return connectionToItems({
        connection: entry.connection,
        level: 1,
        setSize,
        posInSet,
        expandedItems,
        preferencesReadOnly,
        preferencesReadWrite,
        preferencesShellEnabled,
      });
    }

    const isExpanded = !!expandedItems[entry.folder.id];
    const folderItem: FolderTreeItem = {
      id: entry.folder.id,
      level: 1,
      name: entry.folder.name,
      type: 'folder',
      folderId: entry.folder.id,
      setSize,
      posInSet,
      isExpandable: true,
      isExpanded,
    };

    if (!isExpanded) {
      return [folderItem];
    }

    return [
      folderItem,
      ...entry.connections.flatMap((connection, connectionIndex) =>
        connectionToItems({
          connection,
          level: 2,
          setSize: entry.connections.length,
          posInSet: connectionIndex + 1,
          expandedItems,
          preferencesReadOnly,
          preferencesReadWrite,
          preferencesShellEnabled,
        })
      ),
    ];
  });
}
