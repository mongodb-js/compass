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
  DATABASE_ROW_HEIGHT,
} from './constants';
import { DatabaseItem } from './database-item';
import { CollectionItem } from './collection-item';
import type { Actions } from './constants';
import { useVirtualNavigationTree } from './use-virtual-navigation-tree';
import type { NavigationTreeData } from './use-virtual-navigation-tree';
import { DatabasesPlaceholder } from './databases-placeholder';

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

type PlaceholderTreeItem = {
  key: string;
  type: 'placeholder';
  id?: string;
};

type DatabaseTreeItem = {
  key: string;
  type: 'database';
  level: 1;
  id: string;
  name: string;
  isExpanded: boolean;
  setSize: number;
  posInSet: number;
};

type CollectionTreeItem = {
  key: string;
  type: 'collection' | 'view' | 'timeseries';
  level: 2;
  id: string;
  name: string;
  setSize: number;
  posInSet: number;
};

type TreeItem = PlaceholderTreeItem | DatabaseTreeItem | CollectionTreeItem;

type ListItemData = {
  items: TreeItem[];
  isReadOnly: boolean;
  activeNamespace?: string;
  currentTabbable?: string;
  onDatabaseExpand(this: void, id: string, isExpanded: boolean): void;
  onNamespaceAction(this: void, namespace: string, action: Actions): void;
};

const collectionItemContainer = css({
  position: 'relative',
});

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
    onDatabaseExpand,
    onNamespaceAction,
  } = data;

  const itemData = items[index];

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

const DatabasesNavigationTree: React.FunctionComponent<{
  databases: Database[];
  expanded?: Record<string, boolean>;
  onDatabaseExpand(id: string, isExpanded: boolean): void;
  onNamespaceAction(namespace: string, action: Actions): void;
  activeNamespace?: string;
  isReadOnly?: boolean;
}> = ({
  databases,
  expanded = {},
  activeNamespace = '',
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
      onDatabaseExpand(activeNamespace, true);
    }
  }, [activeNamespace, onDatabaseExpand]);

  const items: TreeItem[] = useMemo(() => {
    return databases
      .map(
        (
          { _id: id, name, collections, collectionsLength, collectionsStatus },
          dbIndex
        ) => {
          const isExpanded = expanded[id];

          const database: DatabaseTreeItem = {
            key: String(dbIndex),
            level: 1,
            id,
            name,
            type: 'database' as const,
            isExpanded,
            setSize: databases.length,
            posInSet: dbIndex + 1,
          };

          if (!isExpanded) {
            return [database] as TreeItem[];
          }

          const areCollectionsReady = ['ready', 'refreshing', 'error'].includes(
            collectionsStatus
          );

          const placeholdersLength = Math.min(
            collectionsLength,
            MAX_COLLECTION_PLACEHOLDER_ITEMS
          );

          return ([database] as TreeItem[]).concat(
            areCollectionsReady
              ? collections.map(({ _id: id, name, type }, index) => ({
                  key: `${dbIndex}-${index}`,
                  level: 2,
                  id,
                  name,
                  type: type as 'collection' | 'view' | 'timeseries',
                  setSize: collections.length,
                  posInSet: index + 1,
                }))
              : Array.from({ length: placeholdersLength }, (_, index) => ({
                  key: `${dbIndex}-${index}`,
                  type: 'placeholder' as const,
                }))
          );
        }
      )
      .flat();
  }, [databases, expanded]);

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
      onDatabaseExpand,
    };
  }, [
    items,
    isReadOnly,
    activeNamespace,
    currentTabbable,
    onNamespaceAction,
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
  { isReady: boolean } & React.ComponentProps<typeof DatabasesNavigationTree>
> = ({ isReady, ...props }) => {
  return (
    <FadeInPlaceholder
      className={container}
      contentContainerProps={{ className: contentContainer }}
      isContentReady={isReady}
      content={() => {
        return <DatabasesNavigationTree {...props}></DatabasesNavigationTree>;
      }}
      fallback={() => {
        return <DatabasesPlaceholder></DatabasesPlaceholder>;
      }}
    ></FadeInPlaceholder>
  );
};

export { NavigationWithPlaceholder, DatabasesNavigationTree };
