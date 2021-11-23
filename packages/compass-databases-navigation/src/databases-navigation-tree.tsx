/* eslint-disable react/prop-types */
import { css } from '@leafygreen-ui/emotion';
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

type TreeItem =
  | {
      key: string;
      type: 'placeholder';
    }
  | {
      key: string;
      type: 'database';
      id: string;
      name: string;
      isExpanded: boolean;
      setSize: number;
      posInSet: number;
    }
  | {
      key: string;
      type: 'collection' | 'view' | 'timeseries';
      id: string;
      name: string;
      setSize: number;
      posInSet: number;
    };

const navigationTree = css({
  flex: '1 0 auto',
});

type ListItemData = {
  items: TreeItem[];
  isReadOnly: boolean;
  activeNamespace: string;
  onDatabaseExpand(id: string, isExpanded: boolean): void;
  onNamespaceAction(namespace: string, action: Actions): void;
};

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
        onNamespaceAction={onNamespaceAction}
        onDatabaseExpand={onDatabaseExpand}
        {...itemData}
      ></DatabaseItem>
    );
  }

  return (
    <ContentWithFallback
      isContentReady={itemData.type !== 'placeholder'}
      content={(shouldRender) => {
        return (
          // This will always be true at that point, but TS needs some
          // additional convincing so it can figure out the types
          itemData.type !== 'placeholder' &&
          shouldRender && (
            <CollectionItem
              style={style}
              isReadOnly={isReadOnly}
              isActive={itemData.id === activeNamespace}
              onNamespaceAction={onNamespaceAction}
              {...itemData}
            ></CollectionItem>
          )
        );
      }}
      fallback={(shouldRender) => {
        return (
          shouldRender && <PlaceholderItem style={style}></PlaceholderItem>
        );
      }}
    ></ContentWithFallback>
  );
}, areEqual);

// function useRovingTabIndex(items: TreeItem[]): string {}

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

            const database = {
              key: String(dbIndex),
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

  const itemData: ListItemData = useMemo(() => {
    return {
      items,
      isReadOnly,
      activeNamespace,
      onNamespaceAction,
      onDatabaseExpand,
    };
  }, [items, isReadOnly, activeNamespace, onNamespaceAction, onDatabaseExpand]);

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
      <div role="tree" aria-labelledby={id} className={navigationTree}>
        <AutoSizer>
          {({ width, height }) => (
            <List
              ref={listRef}
              width={width}
              height={height}
              itemData={itemData}
              itemCount={items.length}
              // estimatedItemSize={DATABASE_ROW_HEIGHT}
              // itemSize={getItemSize}
              itemSize={DATABASE_ROW_HEIGHT}
              itemKey={getItemKey}
              overscanCount={5}
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
