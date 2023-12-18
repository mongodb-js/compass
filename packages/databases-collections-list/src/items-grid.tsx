/* eslint-disable react/prop-types */
import React, { useContext, useCallback } from 'react';
import {
  css,
  cx,
  spacing,
  VirtualGrid,
  useSortControls,
  useSortedItems,
} from '@mongodb-js/compass-components';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { NamespaceItemCardProps } from './namespace-card';
import { useViewTypeControls } from './use-view-type';
import type { ViewType } from './use-view-type';
import { useCreateControls } from './use-create';
import { useRefreshControls } from './use-refresh';

const { track } = createLoggerAndTelemetry(
  'COMPASS-DATABASES-COLLECTIONS-LIST-UI'
);

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

export const createButton = css({
  whiteSpace: 'nowrap',
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
  onRefreshClick?: () => void;
  renderItem: RenderItem<T>;
};

const CONTROLS_HEIGHT = (spacing[5] as number) + 36;

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
  refreshControls: React.ReactElement | null;
  viewTypeControls: React.ReactElement | null;
  sortControls: React.ReactElement | null;
}>({
  createControls: null,
  refreshControls: null,
  viewTypeControls: null,
  sortControls: null,
});

const GridControls = () => {
  const { createControls, refreshControls, viewTypeControls, sortControls } =
    useContext(ControlsContext);

  return (
    <>
      {createControls && (
        <div className={control} data-testid="create-controls">
          {createControls}
        </div>
      )}
      {refreshControls && (
        <div className={control} data-testid="refresh-controls">
          {refreshControls}
        </div>
      )}
      <div className={cx(control, pushRight)}>{viewTypeControls}</div>
      <div className={control}>{sortControls}</div>
    </>
  );
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
  const onViewTypeChange = useCallback(
    (newType) => {
      track('Switch View Type', { view_type: newType, item_type: itemType });
    },
    [itemType]
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
        renderHeader={GridControls}
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
