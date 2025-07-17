import type React from 'react';
import { useCallback, useRef, useState, useEffect } from 'react';
import {
  FocusState,
  rafraf,
  useFocusState,
} from '@mongodb-js/compass-components';

export type VirtualTreeItem = {
  id: string;
  name: string;
  level: number;
  setSize: number;
  posInSet: number;
  isExpandable: boolean;
  isExpanded?: boolean;
  entrypoint?: 'sidebar' | 'context-menu';
};

export type VirtualPlaceholderItem = {
  type: 'placeholder';
  level: number;
  isExpandable?: never;
};

export type VirtualItem = VirtualTreeItem | VirtualPlaceholderItem;

export type VirtualTreeData = VirtualItem[];

export function isPlaceholderItem(
  item: VirtualItem
): item is VirtualPlaceholderItem {
  return 'type' in item && item.type === 'placeholder';
}

function findNext(
  itemIndex: number,
  items: VirtualTreeData,
  fn?: (item: VirtualTreeItem) => boolean,
  shift = 0
): VirtualTreeItem | null {
  for (let i = itemIndex + 1, len = items.length; i < len; i++) {
    const idx = (i + shift) % len;
    const item = items[idx];
    if (!isPlaceholderItem(item) && (!fn || fn(item))) {
      return item;
    }
  }
  return null;
}

function findPrev(
  itemIndex: number,
  items: VirtualTreeData,
  fn?: (item: VirtualTreeItem) => boolean,
  shift = 0
): VirtualTreeItem | null {
  const len = items.length;
  for (let i = itemIndex - 1; i >= 0; i--) {
    const idx = (i + shift) % len;
    const item = items[idx];
    if (!isPlaceholderItem(item) && (!fn || fn(item))) {
      return item;
    }
  }
  return null;
}

function findFirstItem(items: VirtualTreeData): VirtualTreeItem | null {
  return findNext(-1, items);
}

function findLastItem(items: VirtualTreeData): VirtualTreeItem | null {
  return findPrev(items.length, items);
}

function findParentItem(
  currentItem: VirtualTreeItem,
  currentItemIndex: number,
  items: VirtualTreeData
): VirtualTreeItem | null {
  return findPrev(
    currentItemIndex,
    items,
    (item) => item.level === currentItem.level - 1
  );
}

function findSiblings(
  currentItem: VirtualTreeItem,
  currentItemIndex: number,
  items: VirtualTreeData
): VirtualTreeItem[] {
  const result = [currentItem];
  for (let i = currentItemIndex - 1; i >= 0; i--) {
    const item = items[i];
    if (!isPlaceholderItem(item)) {
      if (item.level === currentItem.level) {
        result.push(item);
      }
      // We found a parent, no need to go further
      if (item.level === currentItem.level - 1) {
        break;
      }
    }
  }
  for (let i = currentItemIndex + 1, len = items.length; i < len; i++) {
    const item = items[i];
    if (!isPlaceholderItem(item)) {
      if (item.level === currentItem.level) {
        result.push(item);
      }
      // We found a parent, no need to go further
      if (item.level === currentItem.level - 1) {
        break;
      }
    }
  }
  return result;
}

export function useVirtualNavigationTree<T extends HTMLElement = HTMLElement>({
  items,
  activeItemId,
  onExpandedChange,
  onFocusMove = () => {
    /* noop */
  },
}: {
  items: VirtualTreeData;
  activeItemId?: string;
  onExpandedChange(item: VirtualTreeItem, isExpanded: boolean): void;
  onFocusMove?: (item: VirtualTreeItem) => void;
}): [React.HTMLProps<T>, string | undefined, boolean] {
  const rootRef = useRef<T | null>(null);
  const activeId = activeItemId || findFirstItem(items)?.id;
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
      const item = findNext(-1, items, (item) => item.id === currentTabbable);
      if (item) {
        onFocusMove(item);
        const cancel = rafraf(() => {
          focusItemById(item.id);
        });
        return cancel;
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
  }, [currentTabbable, focusItemById, focusState, items, onFocusMove]);

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

      const currentItem = findNext(
        -1,
        items,
        (item) => item.id === currentItemId
      );

      if (!currentItem) {
        throw new Error(
          'key event caught on an item that is not part of the items list'
        );
      }

      const currentItemIndex = items.indexOf(currentItem);

      let nextItem: VirtualTreeItem | null = null;

      if (evt.key === 'Home') {
        evt.stopPropagation();
        nextItem = findFirstItem(items);
      }

      if (evt.key === 'End') {
        evt.stopPropagation();
        nextItem = findLastItem(items);
      }

      if (evt.key === 'ArrowDown') {
        evt.preventDefault();
        evt.stopPropagation();
        nextItem = findNext(currentItemIndex, items);
      }

      if (evt.key === 'ArrowUp') {
        evt.preventDefault();
        evt.stopPropagation();
        nextItem = findPrev(currentItemIndex, items);
      }

      if (evt.key === 'ArrowRight') {
        evt.stopPropagation();

        if (currentItem.isExpandable && currentItem.isExpanded === false) {
          onExpandedChange(currentItem, true);
        }

        if (currentItem.isExpandable && currentItem.isExpanded === true) {
          const maybeNextItem = findNext(currentItemIndex, items);
          if (maybeNextItem?.level === currentItem.level + 1) {
            nextItem = maybeNextItem;
          }
        }
      }

      if (evt.key === 'ArrowLeft') {
        evt.stopPropagation();

        if (currentItem.isExpandable && currentItem.isExpanded === true) {
          onExpandedChange(currentItem, false);
        } else {
          nextItem = findParentItem(currentItem, currentItemIndex, items);
        }
      }

      if (evt.key === '*') {
        evt.stopPropagation();
        const siblings = findSiblings(currentItem, currentItemIndex, items);
        for (const item of siblings) {
          if (currentItem.isExpandable && item.isExpanded === false) {
            onExpandedChange(item, true);
          }
        }
      }

      if (/^\p{Letter}$/u.test(evt.key)) {
        evt.stopPropagation();
        const letter = evt.key.toLocaleLowerCase();
        nextItem = findNext(
          0,
          items,
          (item) => item.name.toLocaleLowerCase().startsWith(letter),
          currentItemIndex
        );
      }

      if (nextItem && nextItem !== currentItem) {
        const id = nextItem.id;
        onFocusMove(nextItem);
        setCurrentTabbable(id);
        // Make sure that if we had to do something with the element to make it
        // focusable (like scrolling it into view in the virtual list) we had at
        // least a frame for it to appear before we try to focus it
        requestAnimationFrame(() => {
          focusItemById(id);
        });
      }
    },
    [onExpandedChange, onFocusMove, focusItemById, items]
  );

  const rootProps = {
    ref: rootRef,
    tabIndex,
    onKeyDown,
    ...focusProps,
  };

  const isTreeItemFocused = focusState === FocusState.FocusWithinVisible;

  return [rootProps, currentTabbable, isTreeItemFocused];
}
