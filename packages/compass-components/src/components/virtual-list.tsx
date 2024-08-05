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

export type VirtualListRef = React.MutableRefObject<List | null>;

export type VirtualListProps<T> = {
  /** Items to render using the virtual list */
  items: T[];

  /**
   * Render prop expected to return a ReactNode that will be provided with:
   * - the item being rendered
   * - a ReactRef that it should attach to the container that is expecting
   *   resizes from within
   * - the index of item being rendered
   * */
  renderItem: ItemRenderer<T>;

  /**
   * Function which is used to calculate initial approximate height of the item
   * before it is rendered for the first time. The VirtualList, immediately
   * after first render, starts monitoring the actual height but it is still
   * super useful to avoid a huge flicker during the initial rendering phase
   */
  estimateItemInitialHeight(item: T): number;

  /**
   * How many items to keep rendered outside of the visible viewport. Keeping
   * this number higher reduces the blanks that we see when scrolling fast and
   * keeping it low removes the (possible) scroll jitters towards the scroll end
   * (observed at-least when used in conjunction with CodeMirror editor)
   */
  overScanCount?: number;

  /**
   * The space in pixels to be used as gutter in between the list items. It is
   * advisable to use this prop instead of css margins
   */
  rowGap?: number;

  /**
   * The class applied to the root container of the list. This container also
   * renders an AutoSizer component
   */
  className?: string;

  /**
   * Attribute value for data-testid for the root container of the list
   */
  dataTestId?: string;

  /**
   * Attribute value for data-testid for the container of the list item
   */
  itemDataTestId?: string;

  /**
   * Initial scrollTop value on first render of the list. Helpful to preserve
   * the scrollTop value in between list mounts / unmounts.
   *
   * Note - Use scrollableContainerRef to get a hold of scroll container to
   * retrieve the current scrollTop
   */
  initialScrollTop?: number;

  /**
   * React.Ref passed to the element that overflows in the vertical direction.
   * Helpful to retrieve the value of current scrollTop
   */
  scrollableContainerRef?: React.Ref<HTMLDivElement>;

  /**
   * WARNING: Use only when testing because the AutoSizer will be
   * disabled during tests
   *
   * Renders the VirtualList with the provided width
   */
  __TEST_LIST_WIDTH?: number;

  /**
   * WARNING: Use only when testing because the AutoSizer will be
   * disabled during tests
   *
   * Renders the VirtualList with the provided height
   */
  __TEST_LIST_HEIGHT?: number;

  /**
   * WARNING: Use only when testing
   *
   * Mutable Ref object to hold the reference to the VariableSizeList
   */
  __TEST_LIST_REF?: VirtualListRef;
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
  __TEST_LIST_WIDTH = 1024,
  __TEST_LIST_HEIGHT = 768,
  __TEST_LIST_REF,
}: VirtualListProps<T>) {
  const listRef = useRef<List | null>(null);
  const inUseListRef = __TEST_LIST_REF ?? listRef;
  const { observer, estimatedItemSize, getItemSize } =
    useVirtualListItemObserver({
      rowGap,
      listRef: inUseListRef,
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

  const isTestEnv = process.env.NODE_ENV === 'test';

  return (
    <div className={cx(containerStyles, className)} data-testid={dataTestId}>
      {/* AutoSizer types does not allow both width and height to be disabled
        considering that to be a pointless usecase and hence the type
        definitions are pretty strict. We require these disabled to avoid
        tests flaking out hence ignoring the usage here.
        @ts-ignore */}
      <AutoSizer disableWidth={isTestEnv} disableHeight={isTestEnv}>
        {({ width, height }: { width: number; height: number }) => (
          <List<ItemData<T>>
            ref={inUseListRef}
            width={isTestEnv ? __TEST_LIST_WIDTH : width}
            height={isTestEnv ? __TEST_LIST_HEIGHT : height}
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
