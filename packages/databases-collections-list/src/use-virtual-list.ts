import { useFocusState, FocusState } from '@mongodb-js/compass-components';
import { useRef, useState, useEffect, useCallback } from 'react';

export function useVirtualListArrowNavigation<
  T extends HTMLElement = HTMLElement
>({
  colCount,
  rowCount,
  itemsCount,
  resetActiveItemOnBlur = false,
  pageSize = 3,
}: {
  colCount: number;
  rowCount: number;
  itemsCount: number;
  resetActiveItemOnBlur?: boolean;
  pageSize?: number;
}): [React.HTMLProps<T>, number] {
  const rootNode = useRef<T | null>(null);
  const [focusProps, focusState] = useFocusState();
  const [currentTabbable, setCurrentTabbable] = useState(
    itemsCount > 0 ? 0 : -1
  );

  useEffect(() => {
    if (currentTabbable === -1 && itemsCount > 0) {
      setCurrentTabbable(0);
    }
  }, [itemsCount, currentTabbable]);

  useEffect(() => {
    if (focusState === FocusState.NoFocus && resetActiveItemOnBlur) {
      setCurrentTabbable(0);
    }
  }, [focusState, resetActiveItemOnBlur]);

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
          nextTabbableIndex = currentTabbable - colCount * pageSize;
        }

        if (evt.key === 'PageDown') {
          evt.preventDefault();
          evt.stopPropagation();
          nextTabbableIndex = currentTabbable + colCount * pageSize;
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

  return [{ ref: rootNode, onKeyDown, ...focusProps }, currentTabbable];
}

export function useVirtualRovingIndex<T extends HTMLElement = HTMLElement>({
  currentTabbable,
  onFocusMove,
}: {
  currentTabbable: number;
  onFocusMove(idx: number): void;
}): React.HTMLProps<T> {
  const rootNode = useRef<T | null>(null);
  // We will set tabIndex on the parent element so that it can catch focus even
  // if the currentTabbable is not rendered
  const [tabIndex, setTabIndex] = useState<0 | -1>(0);
  const [focusProps, focusState] = useFocusState();

  // Focuses vlist item by id or falls back to the first focusable element in
  // the container
  const focusTabbable = useCallback(() => {
    const selector =
      currentTabbable >= 0
        ? `[data-vlist-item-idx="${currentTabbable}"]`
        : '[tabindex=0]';
    rootNode.current?.querySelector<T>(selector)?.focus();
  }, [rootNode, currentTabbable]);

  useEffect(() => {
    if (
      [
        FocusState.Focus,
        FocusState.FocusVisible,
        FocusState.FocusWithin,
        FocusState.FocusWithinVisible,
      ].includes(focusState)
    ) {
      setTabIndex(-1);
      onFocusMove(currentTabbable);
      const frame = requestAnimationFrame(() => {
        focusTabbable();
      });
      return () => {
        cancelAnimationFrame(frame);
      };
    } else {
      setTabIndex(0);
    }
  }, [focusState, onFocusMove, focusTabbable, currentTabbable]);

  return { ref: rootNode, tabIndex, ...focusProps };
}
