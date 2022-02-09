import React, { useEffect, useCallback, useContext } from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';
import type { ThunkDispatch } from 'redux-thunk';
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
import type { RootActions, RootState } from '../stores/index';
import { SavedItemCard, CARD_WIDTH, CARD_HEIGHT } from './saved-item-card';
import type { SavedItemCardProps, Action } from './saved-item-card';
import OpenItemModal from './open-item-modal';
import { useGridFilters, useFilteredItems } from '../hooks/use-grid-filters';

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
  onAction,
  onMount,
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
  const [sortControls, sortState] = useSortControls<keyof Item>(sortBy, {
    isDisabled: Boolean(search),
  });
  const sortedItems = useSortedItems(filteredItems, sortState);

  const renderItem: React.ComponentProps<typeof VirtualGrid>['renderItem'] =
    useCallback(
      ({ index }: { index: number }) => {
        const item: Omit<SavedItemCardProps, 'onAction'> = sortedItems[index];
        return (
          <SavedItemCard
            {...item}
            onAction={onAction}
            data-testid={`grid-item-${index}`}
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
    </ControlsContext.Provider>
  );
};

const mapState = ({ savedItems: { items, loading } }: RootState) => ({
  items,
  loading,
});

const mapDispatch = {
  onMount: fetchItems,
  onAction(id: string, actionName: Action) {
    return (
      dispatch: ThunkDispatch<RootState, void, RootActions>,
      getState: () => RootState
    ) => {
      switch (actionName) {
        case 'open':
          return openSavedItem(id)(dispatch, getState);
      }
    };
  },
};

const connector = connect(mapState, mapDispatch);

type AggregationsQueriesListProps = ConnectedProps<typeof connector>;

export default connector(AggregationsQueriesList);
