import React, { forwardRef, useLayoutEffect, useMemo, useRef } from 'react';
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

const flexContainerStyles = css({
  width: '100%',
  height: '100%',
  position: 'relative',
  display: 'flex',
  overflow: 'hidden',
});

const flexItemStyles = css({
  flex: 1,
});

const stableScrollbarGutterStyles = css({
  scrollbarGutter: 'stable',
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
  rowGap?: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
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
   * The padding (in pixels) to be applied at the top of the list.
   *
   * Note: It is advisable to use this prop instead of trying to apply padding /
   * margin using css because the list is of calculated height based on its
   * items, rowGaps, etc and its items are absolutely positioned within it.
   * Setting this number takes care of considering that calculation.
   */
  paddingTop?: number;

  /**
   * The padding (in pixels) to be applied at the bottom of the list.
   *
   * Note: It is advisable to use this prop instead of trying to apply padding /
   * margin using css because the list is of calculated height based on its
   * items, rowGaps, etc and its items are absolutely positioned within it.
   * Setting this number takes care of considering that calculation.
   */
  paddingBottom?: number;

  /**
   * The padding (in pixels) to be applied to the left of the list.
   *
   * Note: It is advisable to use this prop instead of trying to apply padding /
   * margin using css because the list is of calculated height based on its
   * items, rowGaps, etc and its items are absolutely positioned within it.
   * Setting this number takes care of considering that calculation.
   */
  paddingLeft?: number;

  /**
   * The padding (in pixels) to be applied at the right of the list.
   *
   * Note: It is advisable to use this prop instead of trying to apply padding /
   * margin using css because the list is of calculated height based on its
   * items, rowGaps, etc and its items are absolutely positioned within it.
   * Setting this number takes care of considering that calculation.
   */
  paddingRight?: number;

  /**
   * Wether to set scrollbar-gutter to 'stable'. Useful when we want to apply
   * predictable paddingRight on the container. Defaults to false
   */
  useStableScrollbarGutter?: boolean;

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
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight,
  useStableScrollbarGutter = false,
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
      rowGap,
      paddingTop,
      paddingBottom,
      paddingLeft,
      paddingRight,
    }),
    [
      items,
      observer,
      itemDataTestId,
      rowGap,
      paddingTop,
      paddingBottom,
      paddingLeft,
      paddingRight,
      renderItem,
    ]
  );

  const innerElementType = useMemo(
    () =>
      createInnerElement({
        rowGap,
        paddingTop,
        paddingBottom,
        itemsLength: items.length,
      }),
    [rowGap, paddingTop, paddingBottom, items.length]
  );

  const isTestEnv = process.env.NODE_ENV === 'test';

  return (
    // For AutoSizer to grow and fill the available space we need to provide
    // appropriate flex container and flex item styles
    //
    // Reference: https://github.com/bvaughn/react-virtualized/blob/master/docs/usingAutoSizer.md#can-i-use-autosizer-within-a-flex-container
    <div className={flexContainerStyles} data-testid={dataTestId}>
      <div className={flexItemStyles}>
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
              innerElementType={innerElementType}
              className={cx({
                [stableScrollbarGutterStyles]: useStableScrollbarGutter,
              })}
            >
              {DocumentRow}
            </List>
          )}
        </AutoSizer>
      </div>
    </div>
  );
}

function DocumentRow<T>({
  index,
  style,
  data,
}: ListChildComponentProps<ItemData<T>>) {
  const itemRef = useRef<HTMLDivElement>(null);
  const {
    items,
    observer,
    itemDataTestId,
    rowGap = 0,
    paddingTop = 0,
    paddingLeft = 0,
    paddingRight = 0,
    renderItem,
  } = data;
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

  const { appliedTop, appliedLeft, appliedWidth } = useMemo(() => {
    // Reference for all the calculation below:
    // https://github.com/bvaughn/react-window#can-i-add-gutter-or-padding-between-items

    // A row gap, if provided, can only by applied after the first list item
    const appliedRowGap = index !== 0 ? index * rowGap : 0;

    // We mimick a padding left and padding right by essentially deducting the
    // total padding amount from the width of the lest item and then adjusting
    // the left applied on the list item
    const consideredWidthDeductions = paddingLeft + paddingRight;

    // The appliedTop of this list item considers both the paddingTop and rowGap
    const appliedTop =
      typeof style.top !== 'undefined'
        ? parseFloat(style.top.toString()) + paddingTop + appliedRowGap
        : style.top;

    const appliedLeft =
      typeof style.left !== 'undefined'
        ? parseFloat(style.left.toString()) + paddingLeft
        : style.left;

    const appliedWidth =
      typeof style.width !== 'undefined'
        ? `calc(100% - ${consideredWidthDeductions}px)`
        : style.width;
    return {
      appliedTop,
      appliedLeft,
      appliedWidth,
    };
  }, [
    index,
    style.top,
    style.left,
    style.width,
    rowGap,
    paddingTop,
    paddingLeft,
    paddingRight,
  ]);

  return (
    <div
      data-testid={itemDataTestId}
      key={index}
      style={{
        ...style,
        top: appliedTop,
        left: appliedLeft,
        width: appliedWidth,
      }}
    >
      {renderItem(item, itemRef, index)}
    </div>
  );
}

function createInnerElement({
  itemsLength,
  rowGap = 0,
  paddingTop = 0,
  paddingBottom = 0,
}: {
  itemsLength: number;
  rowGap?: number;
  paddingTop?: number;
  paddingBottom?: number;
}) {
  return forwardRef<HTMLDivElement, { style: React.CSSProperties }>(
    function InnerElementType({ style, ...rest }, ref) {
      // Since the inner list items are absolutely positioned within this
      // seemingly scrollable container we need to increase the applied height of
      // this container by the amount of padding on top and bottom and also by the
      // amount of rowGap inserted in between list items which shifted their top
      // values
      //
      // Reference: https://github.com/bvaughn/react-window#can-i-add-padding-to-the-top-and-bottom-of-a-list
      const consideredHeightIncrements =
        paddingTop + paddingBottom + rowGap * (itemsLength - 1);
      const appliedHeight =
        typeof style.height !== 'undefined'
          ? `${
              parseFloat(style.height.toString()) + consideredHeightIncrements
            }px`
          : style.height;
      return (
        <div
          data-testid="virtual-list-overflowed-container"
          ref={ref}
          style={{
            ...style,
            height: appliedHeight,
          }}
          {...rest}
        />
      );
    }
  );
}
