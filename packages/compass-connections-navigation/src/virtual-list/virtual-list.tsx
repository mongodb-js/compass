import React, { useCallback, useMemo, useRef } from 'react';
import {
  isTreeItem,
  useVirtualNavigationTree,
  type VirtualItem,
} from './use-virtual-navigation-tree';
import { FixedSizeList as List } from 'react-window';
import {
  css,
  mergeProps,
  useFocusRing,
  useId,
} from '@mongodb-js/compass-components';

function useDefaultAction<T>(
  item: T,
  onDefaultAction: (
    item: T,
    evt: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>
  ) => void
): React.HTMLAttributes<HTMLDivElement> {
  const onClick = useCallback(
    (evt: React.MouseEvent<HTMLDivElement>) => {
      evt.stopPropagation();
      onDefaultAction(item, evt);
    },
    [onDefaultAction, item]
  );

  const onKeyDown = useCallback(
    (evt: React.KeyboardEvent<HTMLDivElement>) => {
      if (
        // Only handle keyboard events if they originated on the element
        evt.target === evt.currentTarget &&
        [' ', 'Enter'].includes(evt.key)
      ) {
        evt.preventDefault();
        evt.stopPropagation();
        onDefaultAction(item, evt);
      }
    },
    [onDefaultAction, item]
  );

  return { onClick, onKeyDown };
}

type NotPlaceholderTreeItem<T> = T extends { type: 'placeholder' } ? never : T;
type RenderItem<T> = (props: { index: number; item: T }) => React.ReactNode;
export type OnDefaultAction<T> = (
  item: NotPlaceholderTreeItem<T>,
  evt: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>
) => void;
export type OnExpandedChange<T> = (
  item: NotPlaceholderTreeItem<T>,
  expanded: boolean
) => void;

type VirtualTreeProps<T extends VirtualItem> = {
  activeItemId: string;
  items: T[];
  width: number | string;
  height: number | string;
  itemHeight: number;
  renderItem: RenderItem<T>;
  getItemKey: (item: T) => string;
  onDefaultAction: OnDefaultAction<T>;
  onExpandedChange: OnExpandedChange<T>;
};

const navigationTree = css({
  flex: '1 0 auto',
});

export function VirtualTree<T extends VirtualItem>({
  activeItemId,
  items,
  width,
  height,
  itemHeight,
  getItemKey: _getItemKey,
  renderItem,
  onDefaultAction,
  onExpandedChange,
}: VirtualTreeProps<T>) {
  const listRef = useRef<List | null>(null);
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
      items,
      activeItemId,
      onExpandedChange,
      onFocusMove,
    }
  );

  const isTestEnv = process.env.NODE_ENV === 'test';
  const id = useId();

  const itemData = useMemo(() => {
    return {
      items,
      currentTabbable,
      renderItem,
      onDefaultAction,
    };
  }, [items, currentTabbable, renderItem, onDefaultAction]);

  const getItemKey = useCallback(
    (index: number, data: VirtualItemData<T>) => {
      return _getItemKey(data.items[index]);
    },
    [_getItemKey]
  );

  return (
    <div
      role="tree"
      aria-labelledby={id}
      className={navigationTree}
      {...rootProps}
    >
      <List<VirtualItemData<T>>
        ref={listRef}
        width={width}
        height={height}
        itemData={itemData}
        itemCount={items.length}
        itemSize={itemHeight}
        itemKey={getItemKey}
        overscanCount={isTestEnv ? Infinity : 5}
      >
        {TreeItem}
      </List>
    </div>
  );
}

type VirtualItemData<T extends VirtualItem> = {
  items: T[];
  currentTabbable?: string;
  renderItem: RenderItem<T>;
  onDefaultAction: OnDefaultAction<T>;
};
type VirtualItemProps<T extends VirtualItem> = {
  index: number;
  data: VirtualItemData<T>;
};

function TreeItem<T extends VirtualItem>({ index, data }: VirtualItemProps<T>) {
  const { renderItem, items } = data;
  const item = useMemo(() => items[index], [items, index]);
  const focusRingProps = useFocusRing();

  const Component = useMemo(() => {
    return renderItem({ index, item });
  }, [renderItem, index, item]);

  const actionProps = useDefaultAction<T>(item, data.onDefaultAction);

  // Placeholder check
  if (!isTreeItem(item)) {
    return <div>{Component}</div>;
  }

  const treeItemProps = mergeProps(
    {
      role: 'treeitem',
      'aria-level': item.level,
      'aria-setsize': item.setSize,
      'aria-posinset': item.posInSet,
      'aria-expanded': 'isExpanded' in item && item.isExpanded,
      tabIndex: data.currentTabbable === item.id ? 0 : -1,
    },
    actionProps,
    focusRingProps
  );
  return (
    <div data-id={item.id} data-testid={item.id} {...treeItemProps}>
      {Component}
    </div>
  );
}
