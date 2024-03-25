/* eslint-disable react/prop-types */
import React, { useCallback, useMemo, memo, useRef, useEffect } from 'react';
import { FixedSizeList as List, areEqual } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import {
  FadeInPlaceholder,
  css,
  useId,
  VisuallyHidden,
} from '@mongodb-js/compass-components';
import { PlaceholderItem } from './placeholder-item';
import {
  MAX_COLLECTION_PLACEHOLDER_ITEMS,
  MAX_DATABASE_PLACEHOLDER_ITEMS,
  DATABASE_ROW_HEIGHT,
} from './constants';
import { DatabaseItem } from './database-item';
import { CollectionItem } from './collection-item';
import type { Actions } from './constants';
import { useVirtualNavigationTree } from './use-virtual-navigation-tree';
import type { NavigationTreeData } from './use-virtual-navigation-tree';
import { DatabasesPlaceholder } from './databases-placeholder';
import { ConnectionItem } from './connection-item';
import { type ConnectionInfo } from '@mongodb-js/connection-info';

type Collection = {
  _id: string;
  name: string;
  type: string;
};

type Database = {
  _id: string;
  name: string;
  collectionsStatus: string;
  collectionsLength: number;
  collections: Collection[];
};

export type Connection = {
  connectionInfo: ConnectionInfo;
  name: string;
  databasesStatus: string;
  databasesLength: number;
  databases: Database[];
};

type PlaceholderTreeItem = {
  key: string;
  type: 'placeholder';
  id?: string;
};

type ConnectionTreeItem = {
  key: string;
  type: 'connection';
  level: 1;
  id: string;
  name: string;
  isExpanded: boolean;
  setSize: number;
  posInSet: number;
  connectionInfo: ConnectionInfo;
};

type DatabaseTreeItem = {
  key: string;
  type: 'database';
  level: 2;
  id: string;
  name: string;
  isExpanded: boolean;
  setSize: number;
  posInSet: number;
};

type CollectionTreeItem = {
  key: string;
  type: 'collection' | 'view' | 'timeseries';
  level: 3;
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
  activeNamespace?: string;
  currentTabbable?: string;
  onConnectionExpand(this: void, id: string, isExpanded: boolean): void;
  onDatabaseExpand(this: void, id: string, isExpanded: boolean): void;
  onNamespaceAction(this: void, namespace: string, action: Actions): void;
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
    return [connectionTI] as TreeItem[];
  }

  return ([connectionTI] as TreeItem[]).concat(
    areDatabasesReady
      ? databases
          .map((database, databaseIndex) => {
            const dbExpanded =
              expanded && expanded[connectionInfo.id]
                ? (expanded[connectionInfo.id] as Record<string, boolean>)
                : {};
            return databaseToItems({
              database,
              connectionIndex,
              databaseIndex,
              databasesLength: databases.length,
              expanded: dbExpanded,
            });
          })
          .flat()
      : Array.from({ length: placeholdersLength }, (_, index) => ({
          key: `${connectionIndex}-${index}`,
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
  connectionIndex,
  databaseIndex,
  databasesLength,
  expanded,
}: {
  database: Database;
  connectionIndex: number;
  databaseIndex: number;
  databasesLength: number;
  expanded?: Record<string, boolean>;
}): TreeItem[] => {
  const isExpanded = expanded ? expanded[id] : false;

  const databaseTI: DatabaseTreeItem = {
    key: `${connectionIndex}-${databaseIndex}`,
    level: 2,
    id,
    name,
    type: 'database' as const,
    isExpanded,
    setSize: databasesLength,
    posInSet: databaseIndex + 1,
  };

  if (!isExpanded) {
    return [databaseTI] as TreeItem[];
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
          key: `${connectionIndex}-${databaseIndex}-${index}`,
          level: 3,
          id,
          name,
          type: type as 'collection' | 'view' | 'timeseries',
          setSize: collections.length,
          posInSet: index + 1,
        }))
      : Array.from({ length: placeholdersLength }, (_, index) => ({
          key: `${connectionIndex}-${databaseIndex}-${index}`,
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
    isReadOnly,
    activeNamespace,
    currentTabbable,
    onConnectionExpand,
    onDatabaseExpand,
    onNamespaceAction,
  } = data;

  const itemData = items[index];

  if (itemData.type === 'connection') {
    return (
      <ConnectionItem
        style={style}
        isReadOnly={isReadOnly}
        isActive={itemData.id === activeNamespace}
        isTabbable={itemData.id === currentTabbable}
        onNamespaceAction={onNamespaceAction}
        onConnectionExpand={onConnectionExpand}
        {...itemData}
      ></ConnectionItem>
    );
  }

  if (itemData.type === 'database') {
    return (
      <DatabaseItem
        style={style}
        isReadOnly={isReadOnly}
        isActive={itemData.id === activeNamespace}
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
                isActive={itemData.id === activeNamespace}
                isTabbable={itemData.id === currentTabbable}
                onNamespaceAction={onNamespaceAction}
                {...itemData}
              ></CollectionItem>
            )
          );
        }}
        fallback={() => <PlaceholderItem></PlaceholderItem>}
      ></FadeInPlaceholder>
    </div>
  );
}, areEqual);

const navigationTree = css({
  flex: '1 0 auto',
});

const ConnectionsNavigationTree: React.FunctionComponent<{
  connections: Connection[];
  expanded: Record<string, false | Record<string, boolean>>;
  onConnectionExpand(id: string, isExpanded: boolean): void;
  onDatabaseExpand(id: string, isExpanded: boolean): void;
  onNamespaceAction(namespace: string, action: Actions): void;
  activeNamespace?: string;
  isReadOnly?: boolean;
}> = ({
  connections,
  expanded = {},
  activeNamespace = '',
  onConnectionExpand,
  onDatabaseExpand,
  onNamespaceAction,
  isReadOnly = false,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error ignoring test props so they are not part of the interface
  __TEST_REACT_AUTOSIZER_DEFAULT_WIDTH = null,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error ignoring test props so they are not part of the interface
  __TEST_REACT_AUTOSIZER_DEFAULT_HEIGHT = null,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error ignoring test props so they are not part of the interface
  __TEST_REACT_WINDOW_OVERSCAN = null,
}) => {
  const listRef = useRef<List | null>(null);
  const id = useId();

  useEffect(() => {
    if (activeNamespace) {
      // TODO(COMPASS-7775): test this functionality
      // When the connection is collapsed, and we enter a namespace that is inside that connection,
      // the connection should expand automatically.
      // Currently doesn't work because the ids don't include connection
      // - should be fixed with the new state management for sidebar
      onConnectionExpand(activeNamespace, true);
      onDatabaseExpand(activeNamespace, true);
    }
  }, [activeNamespace, onDatabaseExpand]);

  const items: TreeItem[] = useMemo(() => {
    return connections
      .map((connection, connectionIndex) =>
        connectionToItems({
          connection,
          connectionIndex,
          connectionsLength: connections.length,
          expanded,
        })
      )
      .flat();
  }, [connections, expanded]);

  const onExpandedChange = useCallback(
    (item, isExpanded) => {
      onDatabaseExpand(item.id, isExpanded);
    },
    [onDatabaseExpand]
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
      activeItemId: activeNamespace,
      onExpandedChange,
      onFocusMove,
    }
  );

  const itemData: ListItemData = useMemo(() => {
    return {
      items,
      isReadOnly,
      activeNamespace,
      currentTabbable,
      onNamespaceAction,
      onConnectionExpand,
      onDatabaseExpand,
    };
  }, [
    items,
    isReadOnly,
    activeNamespace,
    currentTabbable,
    onNamespaceAction,
    onConnectionExpand,
    onDatabaseExpand,
  ]);

  const getItemKey = useCallback((index: number, data: typeof itemData) => {
    return data.items[index].key;
  }, []);

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
        <AutoSizer
          disableWidth={Boolean(__TEST_REACT_AUTOSIZER_DEFAULT_WIDTH)}
          disableHeight={Boolean(__TEST_REACT_AUTOSIZER_DEFAULT_HEIGHT)}
        >
          {({
            width = __TEST_REACT_AUTOSIZER_DEFAULT_WIDTH,
            height = __TEST_REACT_AUTOSIZER_DEFAULT_HEIGHT,
          }) => (
            <List
              ref={listRef}
              width={width}
              height={height}
              itemData={itemData}
              itemCount={items.length}
              itemSize={DATABASE_ROW_HEIGHT}
              itemKey={getItemKey}
              overscanCount={__TEST_REACT_WINDOW_OVERSCAN ?? 5}
            >
              {NavigationItem}
            </List>
          )}
        </AutoSizer>
      </div>
    </>
  );
};

const container = css({
  display: 'flex',
  flex: '1 0 auto',
});

const contentContainer = css({
  display: 'flex',
  flex: '1 0 auto',
});

const NavigationWithPlaceholder: React.FunctionComponent<
  { isReady: boolean } & React.ComponentProps<typeof ConnectionsNavigationTree>
> = ({ isReady, ...props }) => {
  return (
    <FadeInPlaceholder
      className={container}
      contentContainerProps={{ className: contentContainer }}
      isContentReady={isReady}
      content={() => {
        return (
          <ConnectionsNavigationTree {...props}></ConnectionsNavigationTree>
        );
      }}
      fallback={() => {
        return <DatabasesPlaceholder></DatabasesPlaceholder>;
      }}
    ></FadeInPlaceholder>
  );
};

export { NavigationWithPlaceholder, ConnectionsNavigationTree };
