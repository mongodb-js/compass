import { isEqual } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type VariableSizeList } from 'react-window';

export type VirtualListItemObserverParams<T> = {
  listRef: React.RefObject<VariableSizeList>;
  items: T[];
  estimateItemInitialHeight(item: T): number;
};

export type ListItemObserver = {
  observe(this: void, element: HTMLDivElement, index: number): void;
  unobserve(this: void, element: HTMLDivElement, index: number): void;
};

export const useVirtualListItemObserver = <T>({
  listRef,
  items,
  estimateItemInitialHeight,
}: VirtualListItemObserverParams<T>): {
  observer: ListItemObserver;
  estimatedItemSize: number;
  getItemSize(this: void, index: number): number;
} => {
  const [itemsHeights, setItemsHeights] = useState(
    items.map(estimateItemInitialHeight)
  );
  const itemsHeightsRef = useRef(itemsHeights);
  itemsHeightsRef.current = itemsHeights;

  // A WeakMap of observed elements to their index in the virtual list so that
  // when the observed element changes, we can update the respective index with
  // the modified height.
  const observedElements = useRef(new WeakMap<HTMLDivElement, number>());

  // It will happen from time to time that the observed element will change its
  // height while the resize notification is being delivered. This results in
  // endless loop which gets terminated with an error event. To avoid having the
  // loop terminated error we perform the side effect on resizes (resizing the
  // underlying element while notifying) in the next frame to allow the current
  // notification to get delivered.
  const oldRaf = useRef<number | undefined>();

  const resizeObserver = useMemo(() => {
    return new ResizeObserver((entries) => {
      if (oldRaf.current) {
        cancelAnimationFrame(oldRaf.current);
        oldRaf.current = undefined;
      }

      oldRaf.current = requestAnimationFrame(() => {
        // We use a number list but as a sparse list so that only the indexes
        // for which the heights actually changed gets applied on top of old
        // recorded heights.
        const sparseModifiedIndexes: number[] = [];
        for (const { target, contentRect } of entries) {
          if (target instanceof HTMLDivElement) {
            const targetIndex = observedElements.current.get(target);
            if (targetIndex !== undefined) {
              sparseModifiedIndexes[targetIndex] = contentRect.height;
            }
          }
        }

        // Instead of using the setState with a callback to update itemHeights
        // state we rely on a ref to retrieve the current value of the
        // itemHeights state because we also want to reset the VariableSizeList
        // after the first modified index so that the list can pick up the new
        // heights but only when there was actually an update otherwise not.
        const previousHeights = [...itemsHeightsRef.current];
        const newHeights = Object.assign(
          new Array<number>(),
          previousHeights,
          sparseModifiedIndexes
        );

        if (isEqual(previousHeights, newHeights)) {
          oldRaf.current = undefined;
          return;
        }

        setItemsHeights(newHeights);

        // Since we have sparse list holding the indexes that actually changed,
        // we use that to find the first modified index after which the list
        // should re-render with the updated height
        const indexToResetAfter = sparseModifiedIndexes.findIndex(
          (height) => typeof height === 'number'
        );
        if (indexToResetAfter !== -1) {
          listRef.current?.resetAfterIndex(indexToResetAfter);
        }
        oldRaf.current = undefined;
      });
    });
  }, []);

  const getItemSize = useCallback(
    (idx: number) => {
      // It can happen that there are new items added to the list (when docs per
      // page changes) in which case we won't have their heights in our state
      // hence we fallback to estimating initial document heights.
      return itemsHeights[idx] ?? estimateItemInitialHeight(items[idx]);
    },
    [itemsHeights, items, estimateItemInitialHeight]
  );

  const estimatedItemSize = useMemo(() => {
    return (
      items.reduce((total, _item, index) => total + getItemSize(index), 0) /
      items.length
    );
  }, [items, getItemSize]);

  const listItemObserver = useMemo(
    () => ({
      observe(element: HTMLDivElement, index: number) {
        observedElements.current.set(element, index);
        resizeObserver.observe(element);
      },
      unobserve(element: HTMLDivElement) {
        observedElements.current.delete(element);
        resizeObserver.unobserve(element);
      },
    }),
    [resizeObserver]
  );

  useEffect(() => {
    return () => {
      if (oldRaf.current) {
        cancelAnimationFrame(oldRaf.current);
        oldRaf.current = undefined;
      }
      resizeObserver.disconnect();
    };
  }, []);

  return {
    observer: listItemObserver,
    getItemSize,
    estimatedItemSize,
  };
};
