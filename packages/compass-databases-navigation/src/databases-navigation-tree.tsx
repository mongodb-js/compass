/* eslint-disable react/prop-types */
import { css } from '@leafygreen-ui/emotion';
import React, {
  useCallback,
  useMemo,
  memo,
  useRef,
  useState,
  useEffect,
} from 'react';
import { VisuallyHidden } from '@react-aria/visually-hidden';
// TODO: See comment in constants about row size
// import { VariableSizeList as List, areEqual } from 'react-window';
import { FixedSizeList as List, areEqual } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useId } from '@react-aria/utils';
import {
  ContentWithFallback,
  FocusState,
  spacing,
  uiColors,
  useFocusState,
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
  currentTabbable: string;
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
    // TODO: Animation is missing
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
              isTabbable={itemData.id === currentTabbable}
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

function findParentItemIndex<
  T extends CollectionTreeItem | DatabaseTreeItem =
    | CollectionTreeItem
    | DatabaseTreeItem
>(itemIndex: number, items: T[]): number {
  const item = items[itemIndex];
  const closestParentIndex = items
    .slice(0, itemIndex)
    .reverse()
    .findIndex(({ level }) => item.level - 1 === level);
  return closestParentIndex === -1
    ? closestParentIndex
    : Math.max(-1, itemIndex - (closestParentIndex + 1));
}

function findSiblings<
  T extends CollectionTreeItem | DatabaseTreeItem =
    | CollectionTreeItem
    | DatabaseTreeItem
>(itemIndex: number, items: T[]): T[] {
  const { setSize, posInSet } = items[itemIndex];
  const start = Math.max(0, itemIndex - posInSet);
  return items.slice(start, start + setSize);
}

function useRovingTabIndex<T extends HTMLElement = HTMLElement>({
  items,
  activeItemId,
  onExpandedChange,
  onFocusMove = () => {
    /* noop */
  },
}: {
  items: TreeItem[];
  activeItemId: string;
  onExpandedChange(id: string, isExpanded: boolean): void;
  onFocusMove(item: TreeItem): void;
}): [React.HTMLProps<T>, string] {
  const rootRef = useRef<T | null>(null);
  const itemsWithoutPlaceholders = useMemo(() => {
    return items.filter(
      (item): item is DatabaseTreeItem | CollectionTreeItem =>
        item.type !== 'placeholder'
    );
  }, [items]);
  const activeId = activeItemId || itemsWithoutPlaceholders[0]?.id;
  const [currentTabbable, setCurrentTabbable] = useState(activeId);
  // In case our currentTabbable is not rendered in the virtual list we make the
  // whole tree tabbable at first and then immediately shift the focus as soon
  // as we gave parent component a chance to scroll unrendered element into view
  const [tabIndex, setTabIndex] = useState(0);
  const [focusProps, focusState] = useFocusState();

  const focusItemById = useCallback(
    (id: string) => {
      rootRef.current
        ?.querySelector<T>(`[role="treeitem"][data-id="${id}"]`)
        ?.focus();
    },
    [rootRef]
  );

  useEffect(() => {
    if (
      focusState === FocusState.FocusVisible ||
      focusState === FocusState.Focus
    ) {
      setTabIndex(-1);
      const item = items.find((item) => item.id === currentTabbable);
      if (item) {
        onFocusMove(item);
        const reqId = requestAnimationFrame(() => {
          focusItemById(currentTabbable);
        });
        return () => {
          cancelAnimationFrame(reqId);
        };
      }
    }

    if (
      focusState === FocusState.FocusWithin ||
      focusState === FocusState.FocusWithinVisible
    ) {
      setTabIndex(-1);
    }

    if (focusState === FocusState.NoFocus) {
      setTabIndex(0);
    }
  }, [focusState, currentTabbable, onFocusMove, focusItemById, items]);

  useEffect(() => {
    setCurrentTabbable(activeId);
  }, [activeId]);

  const onKeyDown = useCallback(
    (evt: React.KeyboardEvent<T>) => {
      const treeItem = evt.target as T;

      if (treeItem.getAttribute('role') !== 'treeitem') {
        return;
      }

      const currentItemId = treeItem.dataset.id;

      if (!currentItemId) {
        throw new Error(
          'treeitems should have data-id attribute provided to work correctly'
        );
      }

      const currentItemIndex = itemsWithoutPlaceholders.findIndex(
        (item) => item.id === currentItemId
      );
      const currentItem = itemsWithoutPlaceholders[currentItemIndex];

      let nextItemIndex = -1;

      if (evt.key === 'Home') {
        evt.stopPropagation();
        nextItemIndex = 0;
      }

      if (evt.key === 'End') {
        evt.stopPropagation();
        nextItemIndex = itemsWithoutPlaceholders.length - 1;
      }

      if (evt.key === 'ArrowDown') {
        evt.stopPropagation();
        evt.preventDefault();
        nextItemIndex = currentItemIndex + 1;
      }

      if (evt.key === 'ArrowUp') {
        evt.stopPropagation();
        evt.preventDefault();
        nextItemIndex = currentItemIndex - 1;
      }

      if (evt.key === 'ArrowRight') {
        evt.stopPropagation();

        if (treeItem.getAttribute('aria-expanded') === 'false') {
          onExpandedChange(currentItemId, true);
        }

        if (treeItem.getAttribute('aria-expanded') === 'true') {
          const nextItem = itemsWithoutPlaceholders[currentItemIndex + 1];
          if (nextItem && nextItem.level === currentItem.level) {
            nextItemIndex = currentItemIndex + 1;
          }
        }
      }

      if (evt.key === 'ArrowLeft') {
        evt.stopPropagation();

        if (treeItem.getAttribute('aria-expanded') === 'true') {
          onExpandedChange(currentItemId, false);
        } else {
          nextItemIndex = findParentItemIndex(
            currentItemIndex,
            itemsWithoutPlaceholders
          );
        }
      }

      // if (evt.key === '*') {
      //   evt.stopPropagation();
      //   const siblings = findSiblings(
      //     currentItemIndex,
      //     itemsWithoutPlaceholders
      //   );
      //   console.log(siblings);
      // }

      // if (/^\p{Letter}$/u.test(evt.key)) {
      //   evt.stopPropagation();

      //   const letter = evt.key.toLocaleLowerCase();
      //   const maybeNode = nodes
      //     .slice(currentFocusElementIndex + 1)
      //     .find((node) =>
      //       node.textContent?.trim().toLocaleLowerCase().startsWith(letter)
      //     );

      //   if (maybeNode) {
      //     nextFocusElementIndex = nodes.indexOf(maybeNode);
      //   }
      // }

      if (
        nextItemIndex >= 0 &&
        nextItemIndex < itemsWithoutPlaceholders.length &&
        nextItemIndex !== currentItemIndex
      ) {
        const nextFocusItem = itemsWithoutPlaceholders[nextItemIndex];
        const nextId = nextFocusItem.id;
        onFocusMove(nextFocusItem);
        setCurrentTabbable(nextId);
        // Make sure that if we had to do something with the element to make it
        // focusable (like scrolling it into view in the virtual list) we had at
        // least a frame for it to appear before we try to focus it
        requestAnimationFrame(() => {
          focusItemById(nextId);
        });
      }
    },
    [onExpandedChange, onFocusMove, focusItemById, itemsWithoutPlaceholders]
  );

  const rootProps = {
    ref: rootRef,
    tabIndex,
    onKeyDown,
    ...focusProps,
  };

  return [rootProps, currentTabbable];
}

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

  const [rootProps, currentTabbable] = useRovingTabIndex<HTMLDivElement>({
    items,
    activeItemId: activeNamespace,
    onExpandedChange: onDatabaseExpand,
    onFocusMove(item) {
      const itemIndex = items.indexOf(item);
      if (itemIndex >= 0) {
        // It is possible that the item we are trying to move the focus to is
        // not rendered currently. Scroll it into view so that it's rendered and
        // can be focused
        listRef.current?.scrollToItem(itemIndex);
      }
    },
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
