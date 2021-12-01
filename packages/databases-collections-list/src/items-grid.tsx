/* eslint-disable react/prop-types */
import React from 'react';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { css, spacing, Button } from '@mongodb-js/compass-components';
import { useSortControls, useSortedItems } from './use-sort';

type Item = Record<string, unknown>;

const row = css({
  display: 'flex',
  alignItems: 'stretch',
  '& > *': {
    flex: 'none',
    marginLeft: spacing[3],
    marginBottom: spacing[3],
  },
  '& > *:last-child': {
    marginRight: spacing[3],
  },
});

type ItemRowProps<T extends Item> = {
  style: React.CSSProperties;
  index: number;
  data: CallbackProps & {
    items: T[];
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
  const { items, columnsCount, onItemClick, onDeleteItemClick, renderItem } =
    data;
  const rowStart = index * columnsCount;
  const cells = items.slice(rowStart, rowStart + columnsCount);
  return (
    <div style={style} className={row}>
      {cells.map((item) =>
        renderItem({ item, onItemClick, onDeleteItemClick })
      )}
    </div>
  );
};

const container = css({
  display: 'grid',
  gridTemplateRows: 'auto 1fr',
  gridTemplateColumns: '100%',
  flex: '1 0 auto',
});

const controls = css({
  display: 'flex',
  marginTop: spacing[3],
  marginRight: spacing[3],
  marginBottom: spacing[4],
  marginLeft: spacing[3],
  flex: 'none',
});

const sortContainer = css({
  flex: 'none',
  marginLeft: 'auto',
});

const listContainer = css({
  flex: 1,
});

type CallbackProps = {
  onCreateItemClick(): void;
  onItemClick(id: string): void;
  onDeleteItemClick(id: string): void;
};

interface RenderItem<T> {
  (
    props: {
      item: T;
    } & Omit<CallbackProps, 'onCreateItemClick'>
  ): React.ReactElement;
}

type ItemsGridProps<T> = {
  itemType: 'collection' | 'database';
  itemWidth: number;
  itemHeight: number;
  items: T[];
  sortBy?: { name: Extract<keyof T, string>; label: string }[];
  onCreateItemClick(): void;
  onItemClick(id: string): void;
  onDeleteItemClick(id: string): void;
  renderItem: RenderItem<T>;
};

export const ItemsGrid = <T extends Item>({
  itemType,
  itemWidth,
  itemHeight,
  items,
  sortBy = [],
  onItemClick,
  onDeleteItemClick,
  onCreateItemClick,
  renderItem,
}: ItemsGridProps<T>): React.ReactElement => {
  const [sortControls, sortState] = useSortControls(sortBy);
  const sortedItems = useSortedItems(items, sortState);

  return (
    <div className={container}>
      <div className={controls}>
        <Button variant="primary" onClick={onCreateItemClick}>
          Create {itemType}
        </Button>
        <div className={sortContainer}>{sortControls}</div>
      </div>

      <div className={listContainer}>
        <AutoSizer>
          {({ width, height }) => {
            const columnsCount = Math.max(1, Math.floor(width / itemWidth));
            const rowsCount = Math.ceil(items.length / columnsCount);

            return (
              <FixedSizeList
                width={Math.max(width, itemWidth)}
                height={height}
                itemData={{
                  items: sortedItems,
                  rowsCount,
                  columnsCount,
                  onItemClick,
                  onDeleteItemClick,
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-expect-error
                  renderItem,
                }}
                itemCount={rowsCount}
                itemSize={itemHeight}
                overscanCount={3}
              >
                {ItemRow}
              </FixedSizeList>
            );
          }}
        </AutoSizer>
      </div>
    </div>
  );
};
