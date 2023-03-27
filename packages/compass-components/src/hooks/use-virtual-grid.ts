import type React from 'react';
import { useRef, useState, useEffect, useCallback } from 'react';
import { rafraf } from '../utils/rafraf';

function closest(
  node: HTMLElement | null,
  cond: ((node: HTMLElement) => boolean) | string
): HTMLElement | null {
  if (typeof cond === 'string') {
    return node?.closest(cond) ?? null;
  }

  let parent: HTMLElement | null = node;
  while (parent) {
    if (cond(parent)) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

function vgridItemSelector(idx?: number): string {
  return idx ? `[data-vlist-item-idx="${idx}"]` : '[data-vlist-item-idx]';
}

function getItemIndex(node: HTMLElement): number {
  if (!node.dataset.vlistItemIdx) {
    throw new Error('Trying to get vgrid item index from an non-item element');
  }
  return Number(node.dataset.vlistItemIdx);
}

/**
 * Hook that adds support for the grid keyboard navigation while handling the
 * focus using the roving tab index
 *
 * {@link https://www.w3.org/TR/wai-aria-1.1/#grid}
 * {@link https://www.w3.org/TR/wai-aria-1.1/#gridcell}
 * {@link https://www.w3.org/TR/wai-aria-practices-1.1/#kbd_roving_tabindex}
 */
export function useVirtualGridArrowNavigation<
  T extends HTMLElement = HTMLElement
>({
  colCount,
  rowCount,
  itemsCount,
  resetActiveItemOnBlur = true,
  pageSize = 3,
  defaultCurrentTabbable = 0,
  onFocusMove,
}: {
  colCount: number;
  rowCount: number;
  itemsCount: number;
  resetActiveItemOnBlur?: boolean;
  pageSize?: number;
  defaultCurrentTabbable?: number;
  onFocusMove(idx: number): void;
}): [React.HTMLProps<T>, number] {
  const rootNode = useRef<T | null>(null);
  const [tabIndex, setTabIndex] = useState<0 | -1>(0);
  const [currentTabbable, setCurrentTabbable] = useState(
    defaultCurrentTabbable
  );

  const onFocus = useCallback(
    (evt: React.FocusEvent) => {
      // If we received focus on the grid container itself, this is a keyboard
      // navigation, disable focus on the container to trigger a focus effect
      // for the currentTabbable element
      if (evt.target === evt.currentTarget) {
        setTabIndex(-1);
      } else {
        const focusedItem = closest(
          evt.target as HTMLElement,
          vgridItemSelector()
        );

        // If focus was received somewhere inside grid item, disable focus on
        // the container and mark item that got the interaction as the
        // `currentTabbable` item
        if (focusedItem) {
          setTabIndex(-1);
          setCurrentTabbable(getItemIndex(focusedItem));
        }
      }
    },
    [defaultCurrentTabbable]
  );

  const onBlur = useCallback(() => {
    const isFocusInside =
      closest(
        document.activeElement as HTMLElement,
        (node) => node === rootNode.current
      ) !== null;

    // If focus is outside of the grid container, make the whole container
    // focusable again and reset tabbable item if needed
    if (!isFocusInside) {
      setTabIndex(0);
      if (resetActiveItemOnBlur) {
        setCurrentTabbable(defaultCurrentTabbable);
      }
    }
  }, [resetActiveItemOnBlur, defaultCurrentTabbable]);

  const onMouseDown = useCallback((evt: React.MouseEvent) => {
    const gridItem = closest(evt.target as HTMLElement, vgridItemSelector());
    // If mousedown didn't originate in one of the grid items (we just clicked
    // some empty space in the grid container), prevent default behavior to stop
    // focus on the grid container from happening
    if (!gridItem) {
      evt.preventDefault();
      // Simulate active element blur that normally happens when clicking a
      // non-focusable element
      (document.activeElement as HTMLElement)?.blur();
    }
  }, []);

  const focusProps = { tabIndex, onFocus, onBlur, onMouseDown };

  const onKeyDown = useCallback(
    (evt: React.KeyboardEvent<T>) => {
      const target = evt.target as HTMLElement;

      if (
        rootNode.current &&
        rootNode.current.contains(target) &&
        target.dataset.vlistItemIdx
      ) {
        let nextTabbableIndex = -1;

        if (evt.key === 'ArrowUp') {
          evt.preventDefault();
          evt.stopPropagation();
          nextTabbableIndex =
            rowCount === 1 ? currentTabbable - 1 : currentTabbable - colCount;
        }

        if (evt.key === 'ArrowDown') {
          evt.preventDefault();
          evt.stopPropagation();
          nextTabbableIndex =
            rowCount === 1 ? currentTabbable + 1 : currentTabbable + colCount;
        }

        if (evt.key === 'ArrowLeft') {
          evt.stopPropagation();
          nextTabbableIndex = currentTabbable - 1;
        }

        if (evt.key === 'ArrowRight') {
          evt.stopPropagation();
          nextTabbableIndex = currentTabbable + 1;
        }

        if (evt.key === 'Home') {
          evt.preventDefault();
          evt.stopPropagation();
          if (evt.ctrlKey) {
            nextTabbableIndex = 0;
          } else {
            nextTabbableIndex =
              colCount * Math.floor(currentTabbable / colCount);
          }
        }

        if (evt.key === 'End') {
          evt.preventDefault();
          evt.stopPropagation();
          if (evt.ctrlKey) {
            nextTabbableIndex = itemsCount - 1;
          } else {
            nextTabbableIndex =
              colCount * Math.floor(currentTabbable / colCount) +
              (colCount - 1);
          }
        }

        if (evt.key === 'PageUp') {
          evt.preventDefault();
          evt.stopPropagation();
          const currRow = Math.floor(currentTabbable / colCount);
          const pageStep = Math.min(currRow, pageSize);
          nextTabbableIndex = currentTabbable - colCount * pageStep;
        }

        if (evt.key === 'PageDown') {
          evt.preventDefault();
          evt.stopPropagation();
          const currRow = Math.floor(currentTabbable / colCount);
          const pageStep = Math.min(rowCount - 1 - currRow, pageSize);
          nextTabbableIndex = currentTabbable + colCount * pageStep;
        }

        if (
          nextTabbableIndex !== currentTabbable &&
          nextTabbableIndex >= 0 &&
          nextTabbableIndex < itemsCount
        ) {
          setCurrentTabbable(nextTabbableIndex);
        }
      }
    },
    [currentTabbable, itemsCount, rowCount, colCount, pageSize]
  );

  const activeCurrentTabbable = tabIndex === 0 ? -1 : currentTabbable;

  useEffect(() => {
    // If we have an active current tabbable item (there is a focus somewhere in
    // the grid container) ...
    if (activeCurrentTabbable >= 0) {
      const gridItem = closest(
        document.activeElement as HTMLElement,
        vgridItemSelector()
      );
      const shouldMoveFocus =
        !gridItem || getItemIndex(gridItem) !== activeCurrentTabbable;

      // ... and this item is currently not focused ...
      if (shouldMoveFocus) {
        // ... communicate that there will be a focus change happening (this is
        // needed so that we can scroll invisible virtual item into view if
        // needed) ...
        onFocusMove(activeCurrentTabbable);
        // ... and trigger a focus on the element after a frame delay, so that
        // the item has time to scroll into view and render if needed
        const cancel = rafraf(() => {
          rootNode.current
            ?.querySelector<HTMLElement>(vgridItemSelector(currentTabbable))
            ?.focus();
        });
        return cancel;
      }
    }
  }, [activeCurrentTabbable]);

  return [{ ref: rootNode, onKeyDown, ...focusProps }, activeCurrentTabbable];
}
