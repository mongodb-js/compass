import React, { useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';
import type { ThunkDispatch } from 'redux-thunk';
import { VirtualGrid, css, spacing } from '@mongodb-js/compass-components';
import { fetchItems } from '../stores/aggregations-queries-items';
import { openSavedItem } from '../stores/open-item';
import type { RootActions, RootState } from '../stores/index';
import { SavedItemCard, CARD_WIDTH, CARD_HEIGHT } from './saved-item-card';
import type { SavedItemCardProps, Action } from './saved-item-card';
import OpenItemModal from './open-item-modal';
import { useGridHeader } from '../hooks/use-grid-header';

const row = css({
  gap: spacing[2],
  paddingLeft: spacing[3],
  paddingRight: spacing[3],
  paddingBottom: spacing[2],
});

const AggregationsQueriesList = ({
  loading,
  items,
  fetchItems,
  onAction,
}: AggregationsQueriesListProps) => {
  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const [gridHeader, listItems] = useGridHeader(items);

  const renderItem: React.ComponentProps<typeof VirtualGrid>['renderItem'] =
    useCallback(
      ({ index }: { index: number }) => {
        const item: Omit<SavedItemCardProps, 'onAction'> = listItems[index];
        return <SavedItemCard {...item} onAction={onAction} />;
      },
      [listItems, onAction]
    );

  if (loading) {
    return null;
  }

  return (
    <>
      <VirtualGrid
        itemMinWidth={CARD_WIDTH}
        itemHeight={CARD_HEIGHT + spacing[2]}
        itemsCount={listItems.length}
        renderItem={renderItem}
        renderHeader={gridHeader}
        headerHeight={spacing[5] + 36}
        classNames={{ row }}
      ></VirtualGrid>
      <OpenItemModal></OpenItemModal>
    </>
  );
};

const mapState = ({ savedItems: { items, loading } }: RootState) => ({
  items,
  loading,
});

const mapDispatch = {
  fetchItems,
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
