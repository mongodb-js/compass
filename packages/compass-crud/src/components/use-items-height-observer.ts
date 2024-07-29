import { isEqual } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type VariableSizeList } from 'react-window';

type ReactWindowListItemObserverParams<T, L extends VariableSizeList> = {
  rowGap?: number;
  listRef: React.RefObject<L>;
  items: T[];
  estimateItemInitialHeight(item: T): number;
};

export type ListItemObserver = {
  observe(this: void, element: HTMLDivElement, index: number): void;
  unobserve(this: void, element: HTMLDivElement, index: number): void;
};

export const useReactWindowListItemObserver = <T, L extends VariableSizeList>({
  rowGap,
  listRef,
  items,
  estimateItemInitialHeight,
}: ReactWindowListItemObserverParams<T, L>): {
  observer: ListItemObserver;
  estimatedItemSize: number;
  getItemSize(this: void, index: number): number;
} => {
  const [itemsHeights, setItemsHeights] = useState(
    items.map(estimateItemInitialHeight)
  );
  const itemsHeightsRef = useRef(itemsHeights);
  itemsHeightsRef.current = itemsHeights;

  const observedElements = useRef(new WeakMap<HTMLDivElement, number>());

  const oldRaf = useRef<number | undefined>();

  const resizeObserver = useMemo(() => {
    return new ResizeObserver((entries) => {
      if (oldRaf.current) {
        cancelAnimationFrame(oldRaf.current);
        oldRaf.current = undefined;
      }

      oldRaf.current = requestAnimationFrame(() => {
        const sparseModifiedIndexes: number[] = [];
        for (const { target, contentRect } of entries) {
          if (target instanceof HTMLDivElement) {
            const targetIndex = observedElements.current.get(target);
            if (targetIndex !== undefined) {
              sparseModifiedIndexes[targetIndex] = contentRect.height;
            }
          }
        }

        const previousHeights = [...itemsHeightsRef.current];
        const newHeights = Object.assign(
          new Array<number>(),
          previousHeights,
          sparseModifiedIndexes
        );
        if (isEqual(previousHeights, newHeights)) {
          return;
        }

        setItemsHeights(newHeights);
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
      const height = itemsHeights[idx] ?? estimateItemInitialHeight(items[idx]);
      if (rowGap && idx !== items.length - 1) {
        return height + rowGap;
      }
      return height;
    },
    [rowGap, itemsHeights, items, estimateItemInitialHeight]
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
