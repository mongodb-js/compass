/* eslint-disable react/prop-types */
import React, { useCallback } from 'react';
import {
  css,
  spacing,
  VirtualGrid,
  useSortControls,
  useSortedItems,
} from '@mongodb-js/compass-components';
import { useLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import type { NamespaceItemCardProps } from './namespace-card';
import { useViewTypeControls } from './use-view-type';
import type { ViewType } from './use-view-type';
import { useCreateControls } from './use-create';
import { useRefreshControls } from './use-refresh';
import { GridHeader, ControlsContext, CONTROLS_HEIGHT } from './grid-header';

type Item = { _id: string } & Record<string, unknown>;

const row = css({
  paddingLeft: spacing[3],
  paddingRight: spacing[3],
  paddingBottom: spacing[2],
  columnGap: spacing[2],
});

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
  padding: spacing[3],
  gap: spacing[2],
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
  onRefreshClick?: () => void;
  renderItem: RenderItem<T>;
};

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
  onRefreshClick,
  renderItem: _renderItem,
}: ItemsGridProps<T>): React.ReactElement => {
  const { track } = useLoggerAndTelemetry(
    'COMPASS-DATABASES-COLLECTIONS-LIST-UI'
  );
  const onViewTypeChange = useCallback(
    (newType) => {
      track('Switch View Type', { view_type: newType, item_type: itemType });
    },
    [itemType, track]
  );
  const createControls = useCreateControls(itemType, onCreateItemClick);
  const refreshControls = useRefreshControls(onRefreshClick);
  const [sortControls, sortState] = useSortControls(sortBy);
  const [viewTypeControls, viewType] = useViewTypeControls({
    onChange: onViewTypeChange,
  });
  const sortedItems = useSortedItems(items, sortState);

  const itemWidth = viewType === 'grid' ? itemGridWidth : itemListWidth;
  const itemHeight = viewType === 'grid' ? itemGridHeight : itemListHeight;

  const shouldShowControls = items.length > 0;

  const renderItem: React.ComponentProps<typeof VirtualGrid>['renderItem'] =
    useCallback(
      ({ index, ...props }) => {
        const item = sortedItems[index];
        return _renderItem({
          item,
          viewType,
          onItemClick,
          onDeleteItemClick,
          ...props,
        });
      },
      [_renderItem, onDeleteItemClick, onItemClick, sortedItems, viewType]
    );

  return (
    <ControlsContext.Provider
      value={{
        createControls,
        refreshControls,
        sortControls: shouldShowControls ? sortControls : null,
        viewTypeControls: shouldShowControls ? viewTypeControls : null,
      }}
    >
      <VirtualGrid
        itemMinWidth={itemWidth}
        itemHeight={itemHeight + (spacing[2] as number)}
        itemsCount={sortedItems.length}
        colCount={viewType === 'list' ? 1 : undefined}
        renderItem={renderItem}
        itemKey={(index: number) => sortedItems[index]._id}
        headerHeight={CONTROLS_HEIGHT}
        renderHeader={() => <GridHeader />}
        classNames={{
          container,
          header: controls,
          row: row,
        }}
        resetActiveItemOnBlur={false}
        data-testid={`${itemType}-grid`}
      ></VirtualGrid>
    </ControlsContext.Provider>
  );
};
