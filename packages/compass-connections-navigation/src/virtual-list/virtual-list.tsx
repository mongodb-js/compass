import React, { useCallback, useMemo, useRef } from 'react';
import {
  isPlaceholderItem,
  useVirtualNavigationTree,
  type VirtualTreeItem,
  type VirtualItem,
} from './use-virtual-navigation-tree';
import {
  FixedSizeList as List,
  type ListChildComponentProps,
} from 'react-window';
import {
  css,
  mergeProps,
  useFocusRing,
  useId,
  type ContextMenuItem,
} from '@mongodb-js/compass-components';
import { type SidebarActionableItem, type SidebarTreeItem } from '../tree-data';
import { type Actions } from '../constants';
import { type NavigationItemActions } from '../item-actions';

function useDefaultAction<T extends VirtualTreeItem>(
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
type RenderItem<T> = (props: {
  index: number;
  isActive: boolean;
  isFocused: boolean;
  item: T;
  onItemAction(this: void, item: SidebarActionableItem, action: Actions): void;
  onItemExpand(
    this: void,
    item: SidebarActionableItem,
    isExpanded: boolean
  ): void;
  getItemActions(
    this: void,
    item: SidebarTreeItem
  ): {
    actions: NavigationItemActions;
    config?: {
      collapseAfter: number;
    };
  };
  getContextMenuGroups: (
    this: void,
    item: SidebarTreeItem
  ) => ContextMenuItem[][];
}) => React.ReactNode;
export type OnDefaultAction<T> = (
  item: T,
  evt: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>
) => void;

type VirtualTreeProps<T extends VirtualItem> = {
  dataTestId?: string;
  activeItemId?: string;
  items: T[];
  width: number | string;
  height: number | string;
  itemHeight: number;
  renderItem: RenderItem<T>;
  getItemKey?: (item: T) => string;
  onDefaultAction: OnDefaultAction<NotPlaceholderTreeItem<T>>;
  onItemExpand(
    this: void,
    item: SidebarActionableItem,
    isExpanded: boolean
  ): void;
  onItemAction(this: void, item: SidebarActionableItem, action: Actions): void;
  getItemActions(
    this: void,
    item: SidebarTreeItem
  ): {
    actions: NavigationItemActions;
    config?: {
      collapseAfter: number;
    };
  };
  getContextMenuGroups(this: void, item: SidebarTreeItem): ContextMenuItem[][];

  __TEST_OVER_SCAN_COUNT?: number;
};

const navigationTree = css({
  flex: '1 0 auto',
});

function useAction<T>(fn: RenderItem<T>): RenderItem<T> {
  const ref = useRef(fn);
  ref.current = fn;
  return useMemo(() => {
    return (props) => ref.current(props);
  }, []);
}

export function VirtualTree<T extends VirtualItem>({
  dataTestId,
  activeItemId,
  items,
  width,
  height,
  itemHeight,
  getItemKey: _getItemKey,
  renderItem: _renderItem,
  onDefaultAction,
  onItemExpand,
  onItemAction,
  getItemActions,
  getContextMenuGroups,
  __TEST_OVER_SCAN_COUNT,
}: VirtualTreeProps<T>) {
  const listRef = useRef<List | null>(null);
  const renderItem = useAction(_renderItem);
  const onFocusMove = useCallback(
    (item: VirtualTreeItem) => {
      const idx = items.findIndex(
        (i) => !isPlaceholderItem(i) && i.id === item.id
      );
      if (idx >= 0) {
        // It is possible that the item we are trying to move the focus to is
        // not rendered currently. Scroll it into view so that it's rendered and
        // can be focused
        listRef.current?.scrollToItem(idx);
      }
    },
    [items]
  );
  const [rootProps, currentTabbable, isTreeItemFocused] =
    useVirtualNavigationTree<HTMLDivElement>({
      items,
      activeItemId,
      onExpandedChange: onItemExpand,
      onFocusMove,
    });

  const id = useId();

  const itemData = useMemo(() => {
    return {
      items,
      currentTabbable,
      isTreeItemFocused,
      activeItemId,
      renderItem,
      onDefaultAction,
      onItemAction,
      onItemExpand,
      getItemActions,
      getContextMenuGroups,
    };
  }, [
    items,
    renderItem,
    currentTabbable,
    onDefaultAction,
    activeItemId,
    isTreeItemFocused,
    onItemAction,
    getItemActions,
    onItemExpand,
    getContextMenuGroups,
  ]);

  const getItemKey = useCallback(
    (index: number, data: VirtualItemData<T>) => {
      if (!_getItemKey) {
        return index;
      }
      return _getItemKey(data.items[index]);
    },
    [_getItemKey]
  );

  return (
    <div
      data-testid={dataTestId}
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
        overscanCount={__TEST_OVER_SCAN_COUNT ?? 5}
      >
        {TreeItem}
      </List>
    </div>
  );
}

type VirtualItemData<T extends VirtualItem> = {
  items: T[];
  isTreeItemFocused: boolean;
  currentTabbable?: string;
  activeItemId?: string;
  renderItem: RenderItem<T>;
  onDefaultAction: OnDefaultAction<NotPlaceholderTreeItem<T>>;
  onItemAction(this: void, item: SidebarActionableItem, action: Actions): void;
  onItemExpand(
    this: void,
    item: SidebarActionableItem,
    isExpanded: boolean
  ): void;
  getItemActions(
    this: void,
    item: SidebarTreeItem
  ): {
    actions: NavigationItemActions;
    config?: {
      collapseAfter: number;
    };
  };
  getContextMenuGroups(this: void, item: SidebarTreeItem): ContextMenuItem[][];
};
function TreeItem<T extends VirtualItem>({
  index,
  data,
  style,
}: ListChildComponentProps<VirtualItemData<T>>) {
  const { renderItem, items, activeItemId } = data;
  const item = useMemo(() => items[index], [items, index]);
  const focusRingProps = useFocusRing();

  const component = useMemo(() => {
    return renderItem({
      index,
      item,
      isActive: !isPlaceholderItem(item) && item.id === activeItemId,
      isFocused:
        data.isTreeItemFocused &&
        !isPlaceholderItem(item) &&
        item.id === data.currentTabbable,
      onItemAction: data.onItemAction,
      onItemExpand: data.onItemExpand,
      getItemActions: data.getItemActions,
      getContextMenuGroups: data.getContextMenuGroups,
    });
  }, [
    renderItem,
    index,
    item,
    activeItemId,
    data.currentTabbable,
    data.isTreeItemFocused,
    data.onItemAction,
    data.getItemActions,
    data.onItemExpand,
    data.getContextMenuGroups,
  ]);

  const actionProps = useDefaultAction(
    item as NotPlaceholderTreeItem<T>,
    data.onDefaultAction
  );

  // Placeholder check
  if (isPlaceholderItem(item)) {
    return <div style={style}>{component}</div>;
  }

  const treeItemProps = mergeProps(
    {
      role: 'treeitem',
      'aria-level': item.level,
      'aria-setsize': item.setSize,
      'aria-posinset': item.posInSet,
      'aria-expanded': !!item.isExpanded,
      tabIndex: data.currentTabbable === item.id ? 0 : -1,
    },
    actionProps,
    focusRingProps,
    { style }
  );
  return (
    <div data-id={item.id} data-testid={item.id} {...treeItemProps}>
      {component}
    </div>
  );
}
