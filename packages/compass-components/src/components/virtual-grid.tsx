import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { FixedSizeList } from 'react-window';
import { useDOMRect } from '../hooks/use-dom-rect';
import { useVirtualGridArrowNavigation } from '../hooks/use-virtual-grid';
import { mergeProps } from '../utils/merge-props';

type RenderItem = React.FunctionComponent<
  React.HTMLProps<HTMLDivElement> & {
    index: number;
    ['data-vlist-item-idx']: number;
  }
>;
type RenderHeader = React.FunctionComponent;
type RenderEmptyList = React.FunctionComponent;

type VirtualGridProps = {
  /**
   * Grid item minimum width (items containers will autostretch to the grid
   * container size)
   */
  itemMinWidth: number;
  /**
   * Grid row height
   */
  itemHeight: number;
  /**
   * Number of items in the grid
   */
  itemsCount: number;
  /**
   * Number of columns (default is fitting as much as possible on the screen
   * based on itemMinWidth)
   */
  colCount?: number;
  /**
   * Render method for grid cell content. Receives props that should be passed
   * directly to the cell root node for the keyboard navigation to work
   * correctly
   */
  renderItem: RenderItem;
  /**
   * Custom grid item key (default is item index)
   */
  itemKey?: (index: number) => React.Key | null | undefined;
  /**
   * Header content height
   */
  headerHeight?: number;
  /**
   * Render method for grid header component. This should be used if header
   * content should be scrollable as part of the whole grid
   */
  renderHeader?: RenderHeader;
  /**
   * Render method for empty list items.
   */
  renderEmptyList?: RenderEmptyList;
  /**
   * Number of rows rendered off-screen (default: 3)
   */
  overscanCount?: number;
  /**
   * Custom styling for individual elements within the grid DOM.
   */
  classNames?: {
    container?: string;
    header?: string;
    grid?: string;
    row?: string;
    cell?: string;
  };

  /**
   * Set to `false` of you want the last focused item to be preserved between
   * focus / blur (default: true)
   */
  resetActiveItemOnBlur?: boolean;
};

const GridContext = createContext<
  Pick<
    Required<VirtualGridProps>,
    'headerHeight' | 'renderHeader' | 'renderItem' | 'itemsCount'
  > &
    Pick<VirtualGridProps, 'classNames' | 'itemKey' | 'renderEmptyList'> & {
      rowCount: number;
      colCount: number;
      currentTabbable: number;
      gridProps: React.HTMLProps<HTMLDivElement>;
    }
>({
  headerHeight: 0,
  renderHeader: () => null,
  renderItem: () => null,
  renderEmptyList: () => null,
  itemsCount: 0,
  rowCount: 0,
  colCount: 0,
  currentTabbable: 0,
  gridProps: {},
});

const GridWithHeader = forwardRef<
  HTMLDivElement,
  React.HTMLProps<HTMLDivElement> & {
    // This component only gets styles passed from react-window library and it
    // is always getting a `style.height` property that is a number
    //
    // See: https://github.com/bvaughn/react-window/blob/b0a470cc264e9100afcaa1b78ed59d88f7914ad4/src/FixedSizeList.js#L14-L15
    style: React.CSSProperties & { height: number };
  }
>(function GridHeader({ style, children, ...props }, ref) {
  const {
    headerHeight,
    renderHeader,
    gridProps,
    classNames,
    renderEmptyList,
    itemsCount,
  } = useContext(GridContext);
  return (
    <div
      ref={ref}
      style={{
        ...style,
        height: style.height + headerHeight,
      }}
      {...props}
    >
      <div style={{ height: headerHeight }} className={classNames?.header}>
        {React.createElement(renderHeader, {})}
      </div>
      <div style={{ height: style.height }} {...gridProps}>
        {itemsCount === 0 && renderEmptyList
          ? React.createElement(renderEmptyList, {})
          : children}
      </div>
    </div>
  );
});

const row = css({
  display: 'grid',
  alignItems: 'stretch',
  gridTemplateRows: 'auto',
  gridTemplateColumns: '1fr',
  gridAutoColumns: '1fr',
  gridAutoFlow: 'column',
});

const cell = css({
  width: '100%',
  minWidth: 0,
});

const Row: React.FunctionComponent<{
  style: React.CSSProperties;
  index: number;
}> = ({ style, index }) => {
  const {
    colCount,
    itemsCount,
    renderItem,
    currentTabbable,
    classNames,
    itemKey,
  } = useContext(GridContext);
  const rowStart = index * colCount;
  const cells = useMemo(() => {
    return Array.from({ length: colCount }, (_, cellIdx) => {
      const itemIdx = rowStart + cellIdx;
      const isEmpty = itemIdx >= itemsCount;
      return isEmpty ? (
        <div
          className={cx(cell, classNames?.cell)}
          key={`empty${cellIdx}`}
        ></div>
      ) : (
        React.createElement(renderItem, {
          key: itemKey?.(itemIdx) ?? itemIdx,
          role: 'gridcell',
          className: cx(cell, classNames?.cell),
          tabIndex: itemIdx === currentTabbable ? 0 : -1,
          ['data-vlist-item-idx']: itemIdx,
          index: itemIdx,
        })
      );
    });
  }, [
    colCount,
    rowStart,
    itemsCount,
    classNames?.cell,
    renderItem,
    itemKey,
    currentTabbable,
  ]);

  return (
    <div
      style={style}
      className={cx(row, classNames?.row)}
      role="row"
      aria-rowindex={index + 1}
    >
      {cells}
    </div>
  );
};

const container = css({
  width: '100%',
  flex: 1,
  overflow: 'hidden',
  display: 'grid',
  gridTemplateRows: 'auto 1fr',
  gridTemplateColumns: '100%',
  // This element is focusable only to handle virtual list and will immediately
  // pass focus to its children. This can take a frame though so to avoid
  // outline on the container showing up, we are completely disabling it
  outline: 'none',
});

const grid = css({
  position: 'relative',
});

export const VirtualGrid = forwardRef<
  HTMLDivElement,
  VirtualGridProps &
    Omit<React.HTMLProps<HTMLDivElement>, keyof VirtualGridProps>
>(function VirtualGrid(
  {
    itemMinWidth,
    itemHeight,
    itemsCount,
    colCount: _colCount,
    renderItem,
    headerHeight = 0,
    renderHeader = () => null,
    renderEmptyList,
    overscanCount = 3,
    classNames,
    itemKey,
    resetActiveItemOnBlur,
    ...containerProps
  },
  ref
) {
  const listRef = useRef<FixedSizeList | null>(null);
  const [rectProps, { width: _width, height }] = useDOMRect();

  const width = Math.max(_width, itemMinWidth);
  const colCount = _colCount ?? Math.max(1, Math.floor(width / itemMinWidth));
  const rowCount = Math.ceil(itemsCount / colCount);

  const onFocusMove = useCallback(
    (idx) => {
      const rowIdx = Math.floor(idx / colCount);
      listRef.current?.scrollToItem(rowIdx);
    },
    [listRef, colCount]
  );

  const [navigationProps, currentTabbable] =
    useVirtualGridArrowNavigation<HTMLDivElement>({
      itemsCount,
      colCount,
      rowCount,
      onFocusMove,
      resetActiveItemOnBlur,
    });

  const gridContainerProps = mergeProps(
    { ref, className: cx(container, classNames?.container) },
    containerProps,
    rectProps
  );

  return (
    <GridContext.Provider
      value={{
        rowCount,
        colCount,
        itemsCount,
        renderItem,
        headerHeight,
        renderHeader,
        currentTabbable,
        classNames,
        gridProps: mergeProps(
          {
            role: 'grid',
            'aria-rowcount': rowCount,
            className: cx(grid, classNames?.grid),
          },
          navigationProps
        ),
        itemKey,
        renderEmptyList,
      }}
    >
      <div {...gridContainerProps}>
        <FixedSizeList
          ref={listRef}
          width={width}
          height={height}
          innerElementType={GridWithHeader}
          itemCount={rowCount}
          itemSize={itemHeight}
          overscanCount={overscanCount}
        >
          {Row}
        </FixedSizeList>
      </div>
    </GridContext.Provider>
  );
});
