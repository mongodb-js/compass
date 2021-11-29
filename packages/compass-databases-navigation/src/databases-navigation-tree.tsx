/* eslint-disable react/prop-types */
import { css, cx, keyframes } from '@leafygreen-ui/emotion';
import React, { useCallback, useMemo, memo, useRef } from 'react';
import { VisuallyHidden } from '@react-aria/visually-hidden';
// TODO: See comment in constants about row size
// import { VariableSizeList as List, areEqual } from 'react-window';
import { FixedSizeList as List, areEqual } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useId } from '@react-aria/utils';
import {
  ContentWithFallback,
  spacing,
  uiColors,
} from '@mongodb-js/compass-components';
import { PlaceholderItem } from './placeholder-item';
import {
  MAX_COLLECTION_PLACEHOLDER_ITEMS,
  DATABASE_ROW_HEIGHT,
} from './constants';
import { DatabaseItem } from './database-item';
import { CollectionItem } from './collection-item';
import type { Actions } from './constants';
import {
  useRovingTabIndex,
  NavigationTreeData,
} from './use-virtual-navigation-tree';

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

export const focusRing = css({
  position: 'relative',
  outline: 'none',
  '&::after': {
    position: 'absolute',
    content: '""',
    pointerEvents: 'none',
    top: 3,
    right: 3,
    bottom: 3,
    left: 3,
    borderRadius: spacing[1],
    boxShadow: `0 0 0 0 ${uiColors.focus}`,
    transition: 'box-shadow .16s ease-in',
  },
});

export const focusRingVisible = css({
  '&::after': {
    boxShadow: `0 0 0 3px ${uiColors.focus}`,
    transitionTimingFunction: 'ease-out',
  },
});

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
  activeNamespace: string;
  currentTabbable?: string;
  onDatabaseExpand(id: string, isExpanded: boolean): void;
  onNamespaceAction(namespace: string, action: Actions): void;
};

const collectionItemContainer = css({
  position: 'relative',
});

const fadeInAnimation = keyframes({
  from: {
    opacity: 0,
  },
  to: {
    opacity: 1,
  },
});

const fadeIn = css({
  animation: `${fadeInAnimation} .16s ease-out`,
});

const placeholderContainer = css({
  position: 'absolute',
  pointerEvents: 'none',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  opacity: 0,
  transition: 'opacity .16s ease-out',
});

const placeholderContainerVisible = css({
  opacity: 1,
  transitionTimingFunction: 'ease-in',
});

const NavigationItem = memo<{
  index: number;
  style: React.CSSProperties;
  data: ListItemData;
}>(function NavigationItem({ index, style, data }) {
  // eslint-disable-next-line @typescript-eslint/unbound-method
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
      <ContentWithFallback
        isContentReady={itemData.type !== 'placeholder'}
        content={(shouldRender, shouldAnimate) => {
          return (
            // This will always be true at that point, but TS needs some
            // additional convincing so it can figure out the types
            itemData.type !== 'placeholder' &&
            shouldRender && (
              <div style={style} className={cx(shouldAnimate && fadeIn)}>
                <CollectionItem
                  isReadOnly={isReadOnly}
                  isActive={itemData.id === activeNamespace}
                  isTabbable={itemData.id === currentTabbable}
                  onNamespaceAction={onNamespaceAction}
                  {...itemData}
                ></CollectionItem>
              </div>
            )
          );
        }}
        fallback={(shouldRender) => {
          return (
            <div
              style={style}
              className={css(
                placeholderContainer,
                shouldRender && placeholderContainerVisible
              )}
            >
              <PlaceholderItem></PlaceholderItem>
            </div>
          );
        }}
      ></ContentWithFallback>
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
}) => {
  const listRef = useRef<List | null>(null);

  const id = useId();

  const items: TreeItem[] = useMemo(() => {
    return (
      databases
        .map(
          (
            {
              _id: id,
              name,
              collections,
              collectionsLength,
              collectionsStatus,
            },
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

            const areCollectionsReady = [
              'ready',
              'refreshing',
              'error',
            ].includes(collectionsStatus);

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
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        .flat()
    );
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

  const [rootProps, currentTabbable] = useRovingTabIndex<HTMLDivElement>({
    items: items as NavigationTreeData,
    activeItemId: activeNamespace,
    onExpandedChange,
    onFocusMove,
  });

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

  // TODO: See comment about row size in constants
  // const getItemSize = useCallback(
  //   (index) => {
  //     return items[index].type === 'database'
  //       ? DATABASE_ROW_HEIGHT
  //       : COLLECTION_ROW_HEIGHT;
  //   },
  //   [items]
  // );

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
      >
        <AutoSizer
          disableWidth={Boolean(process.env.TEST_AUTOSIZER_DEFAULT_WIDTH)}
          disableHeight={Boolean(process.env.TEST_AUTOSIZER_DEFAULT_HEIGHT)}
        >
          {({
            width = Number(process.env.TEST_AUTOSIZER_DEFAULT_WIDTH ?? 0),
            height = Number(process.env.TEST_AUTOSIZER_DEFAULT_HEIGHT ?? 0),
          }) => (
            <List
              ref={listRef}
              width={width}
              height={height}
              itemData={itemData}
              itemCount={items.length}
              itemSize={DATABASE_ROW_HEIGHT}
              itemKey={getItemKey}
              overscanCount={Number(
                process.env.TEST_REACT_WINDOW_OVERSCAN ?? 5
              )}
            >
              {NavigationItem}
            </List>
          )}
        </AutoSizer>
      </div>
    </>
  );
};

export { DatabasesNavigationTree };
