import React, { useEffect, useCallback, useContext } from 'react';
import { connect } from 'react-redux';
import {
  VirtualGrid,
  css,
  spacing,
  useSortControls,
  useSortedItems,
} from '@mongodb-js/compass-components';
import { fetchItems } from '../stores/aggregations-queries-items';
import type { Item } from '../stores/aggregations-queries-items';
import { openSavedItem } from '../stores/open-item';
import type { RootState } from '../stores';
import { SavedItemCard, CARD_WIDTH, CARD_HEIGHT } from './saved-item-card';
import type { Action } from './saved-item-card';
import { NoSavedItems, NoSearchResults } from './empty-list-items';
import OpenItemModal from './open-item-modal';
import EditItemModal from './edit-item-modal';
import { useGridFilters, useFilteredItems } from '../hooks/use-grid-filters';
import { editItem } from '../stores/edit-item';
import { confirmDeleteItem } from '../stores/delete-item';
import { copyToClipboard } from '../stores/copy-to-clipboard';
import { useTrackOnChange } from '@mongodb-js/compass-logging/provider';

const sortBy: { name: keyof Item; label: string }[] = [
  {
    name: 'name',
    label: 'Name',
  },
  {
    name: 'lastModified',
    label: 'Last Modified',
  },
];

const headerStyles = css({
  padding: spacing[3],
  display: 'flex',
  justifyContent: 'space-between',
});

const rowStyles = css({
  gap: spacing[2],
  paddingLeft: spacing[3],
  paddingRight: spacing[3],
  paddingBottom: spacing[2],
});

const noSavedItemsStyles = css({
  width: '100%',
});

const ControlsContext = React.createContext<{
  filterControls: React.ReactElement | null;
  sortControls: React.ReactElement | null;
}>({
  filterControls: null,
  sortControls: null,
});

const GridControls = () => {
  const { filterControls, sortControls } = useContext(ControlsContext);

  return (
    <div className={headerStyles}>
      <div>{filterControls}</div>
      <div>{sortControls}</div>
    </div>
  );
};

export type AggregationsQueriesListProps = {
  loading: boolean;
  items: Item[];
  onMount(): void;
  onOpenItem(id: string): void;
  onEditItem(id: string): void;
  onDeleteItem(id: string): void;
  onCopyToClipboard(id: string): void;
};

export const AggregationsQueriesList = ({
  loading,
  items,
  onMount,
  onOpenItem,
  onEditItem,
  onDeleteItem,
  onCopyToClipboard,
}: AggregationsQueriesListProps) => {
  useEffect(() => {
    void onMount();
  }, [onMount]);

  const {
    controls: filterControls,
    conditions: filters,
    search,
  } = useGridFilters(items);

  const filteredItems = useFilteredItems(items, filters, search)
    .filter((e) => e.item.type !== 'updatemany')
    .sort((a, b) => {
      return a.score - b.score;
    })
    .map((x) => x.item);

  useTrackOnChange(
    'COMPASS-MY-QUERIES-UI',
    (track) => {
      track('Screen', { name: 'my_queries' });
    },
    []
  );

  useTrackOnChange(
    'COMPASS-MY-QUERIES-UI',
    (track) => {
      if (filters.database) {
        track('My Queries Filter', { type: 'database' });
      }
    },
    [filters.database]
  );

  useTrackOnChange(
    'COMPASS-MY-QUERIES-UI',
    (track) => {
      if (filters.collection) {
        track('My Queries Filter', { type: 'collection' });
      }
    },
    [filters.collection]
  );

  // If a user is searching, we disable the sort as
  // search results are sorted by match score
  const [sortControls, sortState] = useSortControls(sortBy, {
    isDisabled: Boolean(search),
  });

  useTrackOnChange(
    'COMPASS-MY-QUERIES-UI',
    (track) => {
      track('My Queries Sort', {
        sort_by: sortState.name,
        order: sortState.order === 1 ? 'ascending' : 'descending',
      });
    },
    [sortState]
  );

  const sortedItems = useSortedItems(filteredItems, sortState);

  const onAction = useCallback(
    (id: string, actionName: Action) => {
      switch (actionName) {
        case 'open':
          onOpenItem(id);
          return;
        case 'rename':
          onEditItem(id);
          return;
        case 'delete':
          void onDeleteItem(id);
          return;
        case 'copy':
          void onCopyToClipboard(id);
          return;
      }
    },
    [onOpenItem, onEditItem, onDeleteItem, onCopyToClipboard]
  );

  const renderItem: React.ComponentProps<typeof VirtualGrid>['renderItem'] =
    useCallback(
      ({
        index,
        ...props
      }: Omit<React.HTMLProps<HTMLDivElement>, 'type'> & { index: number }) => {
        const item = sortedItems[index];

        return (
          <SavedItemCard
            id={item.id}
            type={item.type}
            name={item.name}
            database={item.database}
            collection={item.collection}
            lastModified={item.lastModified}
            onAction={onAction}
            data-testid={`grid-item-${index}`}
            {...props}
          />
        );
      },
      [onAction, sortedItems]
    );

  if (loading) {
    return null;
  }

  if (items.length === 0) {
    return (
      <div className={noSavedItemsStyles} data-testid="my-queries-list">
        <NoSavedItems />
      </div>
    );
  }

  return (
    <ControlsContext.Provider
      value={{
        filterControls: filterControls ?? null,
        sortControls: sortControls ?? null,
      }}
    >
      <VirtualGrid
        data-testid="my-queries-list"
        itemMinWidth={CARD_WIDTH}
        itemHeight={CARD_HEIGHT + spacing[2]}
        itemsCount={sortedItems.length}
        renderItem={renderItem}
        itemKey={(index: number) => sortedItems[index].id}
        renderHeader={GridControls}
        headerHeight={spacing[5] + 36}
        renderEmptyList={NoSearchResults}
        classNames={{ row: rowStyles }}
        resetActiveItemOnBlur={false}
      ></VirtualGrid>
      <OpenItemModal></OpenItemModal>
      <EditItemModal></EditItemModal>
    </ControlsContext.Provider>
  );
};

const mapState = ({ savedItems: { items, loading } }: RootState) => ({
  items,
  loading,
});

const mapDispatch = {
  onMount: fetchItems,
  onOpenItem: openSavedItem,
  onEditItem: editItem,
  onDeleteItem: confirmDeleteItem,
  onCopyToClipboard: copyToClipboard,
};

export default connect(
  mapState,
  mapDispatch
)(AggregationsQueriesList) as React.FunctionComponent<Record<string, never>>;
