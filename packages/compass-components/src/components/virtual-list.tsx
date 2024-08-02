import React, { useLayoutEffect, useMemo, useRef } from 'react';
import {
  VariableSizeList as List,
  type ListChildComponentProps,
} from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { css, cx } from '@leafygreen-ui/emotion';

import {
  type ListItemObserver,
  useVirtualListItemObserver,
} from '../hooks/use-virtual-list-item-observer';

const containerStyles = css({
  width: '100%',
  height: '100%',
  position: 'relative',
});

export type ItemRenderer<T> = (
  item: T,
  ref: React.Ref<HTMLDivElement>,
  index: number
) => React.ReactNode;

type ItemData<T> = {
  items: T[];
  observer: ListItemObserver;
  renderItem: ItemRenderer<T>;
  itemDataTestId?: string;
};

export type VirtualListProps<T> = {
  items: T[];
  renderItem: ItemRenderer<T>;
  estimateItemInitialHeight(item: T): number;

  overScanCount?: number;
  rowGap?: number;
  className?: string;
  dataTestId?: string;
  itemDataTestId?: string;
  initialScrollTop?: number;
  scrollableContainerRef?: React.Ref<HTMLDivElement>;
};

export function VirtualList<T>({
  items,
  estimateItemInitialHeight,
  renderItem,

  overScanCount,
  rowGap,
  className,
  dataTestId,
  itemDataTestId,
  initialScrollTop,
  scrollableContainerRef,
}: VirtualListProps<T>) {
  const listRef = useRef<List | null>(null);
  const { observer, estimatedItemSize, getItemSize } =
    useVirtualListItemObserver({
      rowGap,
      listRef,
      items,
      estimateItemInitialHeight,
    });

  const itemData = useMemo(
    () => ({
      items,
      observer,
      itemDataTestId,
      renderItem,
    }),
    [items, observer, itemDataTestId, renderItem]
  );

  return (
    <div className={cx(containerStyles, className)} data-testid={dataTestId}>
      <AutoSizer>
        {({ width, height }: { width: number; height: number }) => (
          <List<ItemData<T>>
            ref={listRef}
            width={width}
            height={height}
            itemData={itemData}
            itemCount={items.length}
            estimatedItemSize={estimatedItemSize}
            itemSize={getItemSize}
            overscanCount={overScanCount}
            initialScrollOffset={initialScrollTop}
            outerRef={scrollableContainerRef}
          >
            {DocumentRow}
          </List>
        )}
      </AutoSizer>
    </div>
  );
}

function DocumentRow<T>({
  index,
  style,
  data,
}: ListChildComponentProps<ItemData<T>>) {
  const itemRef = useRef<HTMLDivElement>(null);
  const { items, observer, itemDataTestId, renderItem } = data;
  const item = items[index];

  useLayoutEffect(() => {
    const itemRefCurrent = itemRef.current;
    if (itemRefCurrent) {
      observer.observe(itemRefCurrent, index);
    }

    return () => {
      if (itemRefCurrent) {
        observer.unobserve(itemRefCurrent, index);
      }
    };
  }, [observer, index]);

  return (
    <div data-testid={itemDataTestId} key={index} style={style}>
      {renderItem(item, itemRef, index)}
    </div>
  );
}
