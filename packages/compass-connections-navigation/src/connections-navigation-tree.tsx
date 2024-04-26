import React, { useCallback, useMemo, memo, useRef } from 'react';
import { FixedSizeList as List, areEqual } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import {
  FadeInPlaceholder,
  css,
  useId,
  VisuallyHidden,
  spacing,
} from '@mongodb-js/compass-components';
import { PlaceholderItem } from './placeholder-item';
import {
  MAX_COLLECTION_PLACEHOLDER_ITEMS,
  MAX_DATABASE_PLACEHOLDER_ITEMS,
  ROW_HEIGHT,
} from './constants';
import { DatabaseItem } from './database-item';
import { CollectionItem } from './collection-item';
import type { Actions } from './constants';
import { useVirtualNavigationTree } from './use-virtual-navigation-tree';
import type { NavigationTreeData } from './use-virtual-navigation-tree';
import { TopPlaceholder } from './top-placeholder';
import { ConnectionItem } from './connection-item';
import { type ConnectionInfo } from '@mongodb-js/connection-info';
import { usePreference } from 'compass-preferences-model/provider';
import { type WorkspaceTab } from '@mongodb-js/compass-workspaces';

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
};

type PlaceholderTreeItem = {
  key: string;
  type: 'placeholder';
  level: number;
  id?: string;
};

type ConnectionTreeItem = {
  key: string;
  type: 'connection';
  level: number;
  id: string;
  name: string;
  isExpanded: boolean;
  setSize: number;
  posInSet: number;
  connectionInfo: ConnectionInfo;
};

type DatabaseTreeItem = {
  connectionId: string;
  key: string;
  type: 'database';
  level: number;
  id: string;
  name: string;
  isExpanded: boolean;
  setSize: number;
  posInSet: number;
};

type CollectionTreeItem = {
  connectionId: string;
  key: string;
  type: 'collection' | 'view' | 'timeseries';
  level: number;
  id: string;
  name: string;
  setSize: number;
  posInSet: number;
};

type TreeItem =
  | PlaceholderTreeItem
  | ConnectionTreeItem
  | DatabaseTreeItem
  | CollectionTreeItem;

type ListItemData = {
  items: TreeItem[];
  isReadOnly: boolean;
  isSingleConnection?: boolean;
  activeWorkspace?: WorkspaceTab;
  currentTabbable?: string;
  onConnectionExpand(this: void, id: string, isExpanded: boolean): void;
  onConnectionSelect(this: void, id: string): void;
  onDatabaseExpand(
    this: void,
    connectionId: string,
    id: string,
    isExpanded: boolean
  ): void;
  onNamespaceAction(
    this: void,
    connectionId: string,
    namespace: string,
    action: Actions
  ): void;
};

const collectionItemContainer = css({
  position: 'relative',
});

const connectionToItems = ({
  connection: {
    connectionInfo,
    name,
    databases,
    databasesStatus,
    databasesLength,
  },
  connectionIndex,
  connectionsLength,
  expanded,
}: {
  connection: Connection;
  connectionIndex: number;
  connectionsLength: number;
  expanded?: Record<string, false | Record<string, boolean>>;
}): TreeItem[] => {
  const isExpanded = !!(expanded && expanded[connectionInfo.id]);

  const areDatabasesReady = ['ready', 'refreshing', 'error'].includes(
    databasesStatus
  );

  const placeholdersLength = Math.min(
    databasesLength,
    MAX_DATABASE_PLACEHOLDER_ITEMS
  );

  const connectionTI: ConnectionTreeItem = {
    key: String(connectionIndex),
    level: 1,
    id: connectionInfo.id,
    name,
    type: 'connection' as const,
    isExpanded,
    setSize: connectionsLength,
    posInSet: connectionIndex + 1,
    connectionInfo,
  };

  if (!isExpanded) {
    return [connectionTI];
  }

  return ([connectionTI] as TreeItem[]).concat(
    areDatabasesReady
      ? databases.flatMap((database, databaseIndex) => {
          const dbExpanded = expanded?.[connectionInfo.id] || {};
          return databaseToItems({
            connectionId: connectionInfo.id,
            database,
            connectionIndex,
            databaseIndex,
            databasesLength: databases.length,
            expanded: dbExpanded,
            level: 2,
          });
        })
      : Array.from({ length: placeholdersLength }, (_, index) => ({
          key: `${connectionIndex}-${index}`,
          level: 2,
          type: 'placeholder' as const,
        }))
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
  connectionIndex,
  databaseIndex,
  databasesLength,
  expanded,
  level,
}: {
  database: Database;
  connectionId: string;
  connectionIndex?: number;
  databaseIndex: number;
  databasesLength: number;
  expanded?: Record<string, boolean>;
  level: number;
}): TreeItem[] => {
  const isExpanded = expanded ? expanded[id] : false;
  const isInConnection = typeof connectionIndex !== undefined;

  const databaseTI: DatabaseTreeItem = {
    connectionId,
    key: isInConnection
      ? `${connectionIndex as number}-${databaseIndex}`
      : `${databaseIndex}`,
    level,
    id,
    name,
    type: 'database' as const,
    isExpanded,
    setSize: databasesLength,
    posInSet: databaseIndex + 1,
  };

  if (!isExpanded) {
    return [databaseTI];
  }

  const areCollectionsReady = ['ready', 'refreshing', 'error'].includes(
    collectionsStatus
  );

  const placeholdersLength = Math.min(
    collectionsLength,
    MAX_COLLECTION_PLACEHOLDER_ITEMS
  );

  return ([databaseTI] as TreeItem[]).concat(
    areCollectionsReady
      ? collections.map(({ _id: id, name, type }, index) => ({
          connectionId,
          key: isInConnection
            ? `${connectionIndex as number}-${databaseIndex}-${index}`
            : `${databaseIndex}-${index}`,
          level: level + 1,
          id,
          name,
          type: type as 'collection' | 'view' | 'timeseries',
          setSize: collections.length,
          posInSet: index + 1,
        }))
      : Array.from({ length: placeholdersLength }, (_, index) => ({
          key: isInConnection
            ? `${connectionIndex as number}-${databaseIndex}-${index}`
            : `${databaseIndex}-${index}`,
          level: level + 1,
          type: 'placeholder' as const,
        }))
  );
};

const NavigationItem = memo<{
  index: number;
  style: React.CSSProperties;
  data: ListItemData;
}>(function NavigationItem({ index, style, data }) {
  const {
    items,
    isSingleConnection,
    isReadOnly,
    activeWorkspace,
    currentTabbable,
    onConnectionExpand,
    onConnectionSelect,
    onDatabaseExpand,
    onNamespaceAction,
  } = data;

  const itemData = items[index];

  if (itemData.type === 'connection') {
    return (
      <ConnectionItem
        connectionId={itemData.connectionInfo.id}
        style={style}
        isReadOnly={isReadOnly}
        isSingleConnection={isSingleConnection}
        isActive={
          activeWorkspace?.type === 'Databases' &&
          activeWorkspace.connectionId === itemData.connectionInfo.id
        }
        isTabbable={itemData.id === currentTabbable}
        onNamespaceAction={onNamespaceAction}
        onConnectionExpand={onConnectionExpand}
        onConnectionSelect={onConnectionSelect}
        {...itemData}
      ></ConnectionItem>
    );
  }

  if (itemData.type === 'database') {
    return (
      <DatabaseItem
        style={style}
        isReadOnly={isReadOnly}
        isSingleConnection={isSingleConnection}
        isActive={
          activeWorkspace?.type === 'Collections' &&
          activeWorkspace.connectionId === itemData.connectionId &&
          activeWorkspace.namespace === itemData.id
        }
        isTabbable={itemData.id === currentTabbable}
        onNamespaceAction={onNamespaceAction}
        onDatabaseExpand={onDatabaseExpand}
        {...itemData}
      ></DatabaseItem>
    );
  }

  return (
    <div className={collectionItemContainer}>
      <FadeInPlaceholder
        isContentReady={itemData.type !== 'placeholder'}
        contentContainerProps={{ style }}
        fallbackContainerProps={{ style }}
        content={() => {
          return (
            itemData.type !== 'placeholder' && (
              <CollectionItem
                isReadOnly={isReadOnly}
                isSingleConnection={isSingleConnection}
                isActive={
                  activeWorkspace?.type === 'Collection' &&
                  activeWorkspace.connectionId === itemData.connectionId &&
                  activeWorkspace.namespace === itemData.id
                }
                isTabbable={itemData.id === currentTabbable}
                onNamespaceAction={onNamespaceAction}
                {...itemData}
              ></CollectionItem>
            )
          );
        }}
        fallback={() => (
          <PlaceholderItem
            level={itemData.level}
            isSingleConnection={isSingleConnection}
          ></PlaceholderItem>
        )}
      ></FadeInPlaceholder>
    </div>
  );
}, areEqual);

const navigationTree = css({
  flex: '1 0 auto',
});

interface ConnectionsNavigationTreeProps {
  connections: Connection[];
  expanded?: Record<string, false | Record<string, boolean>>;
  onConnectionExpand?(id: string, isExpanded: boolean): void;
  onConnectionSelect?(id: string): void;
  onDatabaseExpand(connectionId: string, id: string, isExpanded: boolean): void;
  onNamespaceAction(
    connectionId: string,
    namespace: string,
    action: Actions
  ): void;
  activeWorkspace?: WorkspaceTab;
  isReadOnly?: boolean;
}

const ConnectionsNavigationTree: React.FunctionComponent<
  ConnectionsNavigationTreeProps
> = ({
  connections,
  expanded,
  activeWorkspace,
  // onConnectionExpand and onConnectionSelect only has a default to support single-connection usage
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onConnectionExpand = () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onConnectionSelect = () => {},
  onDatabaseExpand,
  onNamespaceAction,
  isReadOnly = false,
}) => {
  const isSingleConnection = !usePreference(
    'enableNewMultipleConnectionSystem'
  );

  const listRef = useRef<List | null>(null);
  const id = useId();

  const items: TreeItem[] = useMemo(() => {
    if (!isSingleConnection) {
      return connections.flatMap((connection, connectionIndex) =>
        connectionToItems({
          connection,
          connectionIndex,
          connectionsLength: connections.length,
          expanded,
        })
      );
    } else {
      const connection = connections[0];
      return connection.databases.flatMap((database, databaseIndex) => {
        let isExpanded: undefined | Record<string, boolean> = undefined;
        if (expanded) {
          isExpanded = expanded[connection.connectionInfo.id] || {};
        }

        return databaseToItems({
          connectionId: connection.connectionInfo.id,
          database,
          databaseIndex,
          databasesLength: connection.databases.length || 0,
          expanded: isExpanded,
          level: 1,
        });
      });
    }
  }, [isSingleConnection, connections, expanded]);

  const onExpandedChange = useCallback(
    ({ id, type, connectionId }, isExpanded: boolean) => {
      if (type === 'database') onDatabaseExpand(connectionId, id, isExpanded);
      if (type === 'connection') onConnectionExpand(id, isExpanded);
    },
    [onDatabaseExpand, onConnectionExpand]
  );

  const onFocusMove = useCallback(
    (item) => {
      const idx = items.indexOf(item);
      if (idx >= 0) {
        // It is possible that the item we are trying to move the focus to is
        // not rendered currently. Scroll it into view so that it's rendered and
        // can be focused
        listRef.current?.scrollToItem(idx);
      }
    },
    [items]
  );

  const [rootProps, currentTabbable] = useVirtualNavigationTree<HTMLDivElement>(
    {
      items: items as NavigationTreeData,
      activeItemId:
        (activeWorkspace as { namespace?: string })?.namespace || '', // TODO(COMPASS-7887)
      onExpandedChange,
      onFocusMove,
    }
  );

  const itemData: ListItemData = useMemo(() => {
    return {
      items,
      isReadOnly,
      isSingleConnection,
      activeWorkspace,
      currentTabbable,
      onNamespaceAction,
      onConnectionExpand,
      onConnectionSelect,
      onDatabaseExpand,
    };
  }, [
    items,
    isReadOnly,
    isSingleConnection,
    activeWorkspace,
    currentTabbable,
    onNamespaceAction,
    onConnectionExpand,
    onConnectionSelect,
    onDatabaseExpand,
  ]);

  const getItemKey = useCallback((index: number, data: typeof itemData) => {
    return data.items[index].key;
  }, []);

  const isTestEnv = process.env.NODE_ENV === 'test';

  return (
    <>
      <VisuallyHidden id={id}>Databases and Collections</VisuallyHidden>
      <div
        role="tree"
        aria-labelledby={id}
        className={navigationTree}
        {...rootProps}
        data-testid="databases-and-collections"
      >
        <AutoSizer disableWidth={isTestEnv} disableHeight={isTestEnv}>
          {({
            width = isTestEnv ? 1024 : '',
            height = isTestEnv ? 768 : '',
          }) => (
            <List
              ref={listRef}
              width={width}
              height={height}
              itemData={itemData}
              itemCount={items.length}
              itemSize={ROW_HEIGHT}
              itemKey={getItemKey}
              overscanCount={isTestEnv ? Infinity : 5}
            >
              {NavigationItem}
            </List>
          )}
        </AutoSizer>
      </div>
    </>
  );
};

const MCContainer = css({
  display: 'flex',
  flex: '1 0 auto',
  height: `calc(100% - ${spacing[3]}px)`,
});

const SCContainer = css({
  display: 'flex',
  flex: '1 0 auto',
  height: 0,
});

const contentContainer = css({
  display: 'flex',
  flex: '1 0 auto',
});

const NavigationWithPlaceholder: React.FunctionComponent<
  { isReady: boolean } & React.ComponentProps<typeof ConnectionsNavigationTree>
> = ({ isReady, ...props }) => {
  const isSingleConnection = !usePreference(
    'enableNewMultipleConnectionSystem'
  );

  return (
    <FadeInPlaceholder
      className={isSingleConnection ? SCContainer : MCContainer}
      contentContainerProps={{ className: contentContainer }}
      isContentReady={isReady}
      content={() => {
        return (
          <ConnectionsNavigationTree {...props}></ConnectionsNavigationTree>
        );
      }}
      fallback={() => {
        return (
          <TopPlaceholder
            isSingleConnection={isSingleConnection}
          ></TopPlaceholder>
        );
      }}
    ></FadeInPlaceholder>
  );
};

export { NavigationWithPlaceholder, ConnectionsNavigationTree };
