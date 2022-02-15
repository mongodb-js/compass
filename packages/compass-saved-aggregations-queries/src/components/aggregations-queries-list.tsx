import React, { useEffect, useCallback, useContext } from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';
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
import type { RootState } from '../stores/index';
import { SavedItemCard, CARD_WIDTH, CARD_HEIGHT } from './saved-item-card';
import type { Action } from './saved-item-card';
import OpenItemModal from './open-item-modal';
import EditItemModal from './edit-item-modal';
import DeleteItemModal from './delete-item-modal';
import { useGridFilters, useFilteredItems } from '../hooks/use-grid-filters';
import { editItem } from '../stores/edit-item';
import { deleteItem } from '../stores/delete-item';
import { copyToClipboard } from '../stores/copy-to-clipboard';

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
  margin: spacing[3],
  display: 'flex',
  justifyContent: 'space-between',
});

const rowStyles = css({
  gap: spacing[2],
  paddingLeft: spacing[3],
  paddingRight: spacing[3],
  paddingBottom: spacing[2],
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

const AggregationsQueriesList = ({
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
    .sort((a, b) => {
      return a.score - b.score;
    })
    .map((x) => x.item);

  // If a user is searching, we disable the sort as
  // search results are sorted by match score
  const [sortControls, sortState] = useSortControls(sortBy, {
    isDisabled: Boolean(search),
  });

  const sortedItems = useSortedItems(filteredItems, sortState);

  const onAction = useCallback(
    (id: string, actionName: Action) => {
      switch (actionName) {
        case 'open':
          return onOpenItem(id);
        case 'edit':
          return onEditItem(id);
        case 'delete':
          return onDeleteItem(id);
        case 'copy':
          return onCopyToClipboard(id);
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

  return (
    <ControlsContext.Provider
      value={{
        filterControls: filterControls ?? null,
        sortControls: sortControls ?? null,
      }}
    >
      <VirtualGrid
        itemMinWidth={CARD_WIDTH}
        itemHeight={CARD_HEIGHT + spacing[2]}
        itemsCount={sortedItems.length}
        renderItem={renderItem}
        renderHeader={GridControls}
        headerHeight={spacing[5] + 36}
        classNames={{ row: rowStyles }}
      ></VirtualGrid>
      <OpenItemModal></OpenItemModal>
      <EditItemModal></EditItemModal>
      <DeleteItemModal></DeleteItemModal>
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
  onDeleteItem: deleteItem,
  onCopyToClipboard: copyToClipboard,
};

const connector = connect(mapState, mapDispatch);

type AggregationsQueriesListProps = ConnectedProps<typeof connector>;

export default connector(AggregationsQueriesList);
