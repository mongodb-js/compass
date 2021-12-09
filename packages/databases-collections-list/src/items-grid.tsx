/* eslint-disable react/prop-types */
import React, {
  useMemo,
  forwardRef,
  useContext,
  useRef,
  useCallback,
} from 'react';
import { FixedSizeList } from 'react-window';
import { css, cx, spacing, useDOMRect } from '@mongodb-js/compass-components';
import { useSortControls, useSortedItems } from './use-sort';
import type { NamespaceItemCardProps } from './namespace-card';
import { useViewTypeControls, ViewType } from './use-view-type';
import { useCreateControls } from './use-create';
import { mergeProps } from './merge-props';
import {
  useVirtualGridArrowNavigation,
  useVirtualRovingTabIndex,
} from './use-virtual-grid';

type Item = Record<string, unknown>;

const row = css({
  paddingLeft: spacing[3],
  paddingRight: spacing[3],
  paddingBottom: spacing[2],
  display: 'grid',
  alignItems: 'stretch',
  gridTemplateRows: 'auto',
  gridTemplateColumns: '1fr',
  gridAutoColumns: '1fr',
  gridAutoFlow: 'column',
  columnGap: spacing[2],
});

const cell = css({
  width: '100%',
  minWidth: 0,
});

type ItemRowProps<T extends Item> = {
  style: React.CSSProperties;
  index: number;
  data: CallbackProps & {
    items: T[];
    currentTabbable: number;
    viewType: ViewType;
    rowsCount: number;
    columnsCount: number;
    renderItem: RenderItem<T>;
  };
};

const ItemRow = <T extends Item>({
  style,
  index,
  data,
}: ItemRowProps<T>): React.ReactElement => {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const {
    items,
    columnsCount,
    currentTabbable,
    onItemClick,
    onDeleteItemClick,
    renderItem,
    viewType,
  } = data;
  const rowStart = index * columnsCount;
  const cells = items.slice(rowStart, rowStart + columnsCount);
  const placeholderCellsCount = columnsCount - cells.length;
  const emptyCells = useMemo(() => {
    return Array.from({ length: placeholderCellsCount }, (_, idx) => (
      <div className={cell} key={`empty${idx}`}></div>
    ));
  }, [placeholderCellsCount]);
  return (
    <div style={style} className={row} role="row" aria-rowindex={index + 1}>
      {cells.map((item, index) => {
        const idx = rowStart + index;
        return renderItem({
          item,
          onItemClick,
          onDeleteItemClick,
          viewType,
          key: `cell${index}`,
          className: cell,
          tabIndex: idx === currentTabbable ? 0 : -1,
          role: 'gridcell',
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error data-* attributes are unrecognised by HTMLProps
          // type
          ['data-vlist-item-idx']: idx,
        });
      })}
      {emptyCells}
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

const controls = css({
  display: 'flex',
  margin: spacing[3],
  gap: spacing[3],
  flex: 'none',
});

export const createButton = css({
  whiteSpace: 'nowrap',
});

const listContainer = css({
  position: 'relative',
});

const control = css({
  flex: 'none',
});

type CallbackProps = {
  onItemClick(id: string): void;
  onCreateItemClick?: () => void;
  onDeleteItemClick?: (id: string) => void;
};

interface RenderItem<T> {
  (
    props: {
      item: T;
      viewType: ViewType;
    } & Omit<CallbackProps, 'onCreateItemClick'> &
      Omit<
        React.HTMLProps<HTMLDivElement>,
        Extract<keyof NamespaceItemCardProps, string>
      >
  ): React.ReactElement;
}

type ItemsGridProps<T> = {
  itemType: 'collection' | 'database';
  itemGridWidth: number;
  itemGridHeight: number;
  itemListWidth?: number;
  itemListHeight?: number;
  items: T[];
  sortBy?: { name: Extract<keyof T, string>; label: string }[];
  onItemClick(id: string): void;
  onDeleteItemClick?: (id: string) => void;
  onCreateItemClick?: () => void;
  renderItem: RenderItem<T>;
};

const CONTROLS_HEIGHT = spacing[5] + 36;

const pushRight = css({
  marginLeft: 'auto',
});

// We use this context to pass components that are aware of outer state of the
// v-list to the list header. This is needed so that we can define this outer
// component outside of the list component scope and avoid constant re-mounts
// when component constructor is re-created. We do this so that controls can be
// part of the list header and scroll up when the list is scrolled
const ControlsContext = React.createContext<{
  createControls: React.ReactElement | null;
  viewTypeControls: React.ReactElement | null;
  sortControls: React.ReactElement | null;
  gridProps: React.HTMLProps<HTMLDivElement>;
}>({
  createControls: null,
  viewTypeControls: null,
  sortControls: null,
  gridProps: {},
});

const ListWithControls = forwardRef<HTMLDivElement>(function ListWithControls(
  { style, children, ...props }: React.HTMLProps<HTMLDivElement>,
  ref
) {
  const { createControls, viewTypeControls, sortControls, gridProps } =
    useContext(ControlsContext);

  return (
    <div
      ref={ref}
      style={{
        ...style,
        height: parseFloat(style?.height as string) + CONTROLS_HEIGHT,
      }}
      {...props}
    >
      <div className={controls}>
        {createControls && <div className={control}>{createControls}</div>}
        <div className={control}>{viewTypeControls}</div>
        <div className={cx(control, pushRight)}>{sortControls}</div>
      </div>
      <div className={listContainer} {...gridProps}>
        {children}
      </div>
    </div>
  );
});

export const ItemsGrid = <T extends Item>({
  itemType,
  itemGridWidth,
  itemGridHeight,
  itemListWidth = itemGridWidth,
  itemListHeight = itemGridHeight,
  items,
  sortBy = [],
  onItemClick,
  onDeleteItemClick,
  onCreateItemClick,
  renderItem,
}: ItemsGridProps<T>): React.ReactElement => {
  const listRef = useRef<FixedSizeList | null>(null);
  const createControls = useCreateControls(itemType, onCreateItemClick);
  const [sortControls, sortState] = useSortControls(sortBy);
  const [viewTypeControls, viewType] = useViewTypeControls();
  const sortedItems = useSortedItems(items, sortState);
  const [rectProps, { width, height }] = useDOMRect();

  const itemWidth = viewType === 'grid' ? itemGridWidth : itemListWidth;
  const itemHeight = viewType === 'grid' ? itemGridHeight : itemListHeight;
  const colCount =
    viewType === 'grid' ? Math.max(1, Math.floor(width / itemWidth)) : 1;
  const rowCount = Math.ceil(items.length / colCount);

  const [listProps, currentTabbable] =
    useVirtualGridArrowNavigation<HTMLDivElement>({
      colCount,
      rowCount,
      itemsCount: sortedItems.length,
    });

  const onFocusMove = useCallback(
    (idx) => {
      const rowIdx = Math.floor(idx / colCount);
      listRef.current?.scrollToItem(rowIdx);
    },
    [listRef, colCount]
  );

  const rovingFocusProps = useVirtualRovingTabIndex<HTMLDivElement>({
    currentTabbable,
    onFocusMove,
  });

  const shouldShowControls = items.length > 0;

  return (
    <ControlsContext.Provider
      value={{
        createControls,
        sortControls: shouldShowControls ? sortControls : null,
        viewTypeControls: shouldShowControls ? viewTypeControls : null,
        gridProps: mergeProps(
          { role: 'grid', 'aria-rowcount': rowCount },
          listProps,
          rovingFocusProps
        ),
      }}
    >
      <div
        className={container}
        data-testid={`${itemType}-grid`}
        {...rectProps}
      >
        <FixedSizeList
          ref={listRef}
          width={Math.max(width, itemWidth)}
          height={height}
          innerElementType={ListWithControls}
          itemData={{
            items: sortedItems,
            viewType,
            rowsCount: rowCount,
            columnsCount: colCount,
            currentTabbable,
            onItemClick,
            onDeleteItemClick,
            renderItem,
          }}
          itemCount={rowCount}
          itemSize={itemHeight + spacing[2]}
          overscanCount={3}
        >
          {/* TypeScript struggles to auto derive generic value without explicitly typing this */}
          {ItemRow as (props: ItemRowProps<T>) => React.ReactElement}
        </FixedSizeList>
      </div>
    </ControlsContext.Provider>
  );
};
