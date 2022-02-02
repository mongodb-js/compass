import React, { useEffect } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';
import { VirtualGrid, H2, css, spacing } from '@mongodb-js/compass-components';
import { fetchItems } from '../stores/aggregations-queries-items';
import { openSavedItem } from '../stores/open-item';
import { RootActions, RootState } from '../stores/index';
import {
  SavedItemCard,
  SavedItemCardProps,
  Action,
  CARD_WIDTH,
  CARD_HEIGHT,
} from './saved-item-card';
import OpenItemModal from './open-item-modal';

const ConnectedItemCard = connect<
  Omit<SavedItemCardProps, 'onAction'>,
  Pick<SavedItemCardProps, 'onAction'>,
  { index: number },
  RootState
>(
  ({ savedItems: { items } }, props) => {
    const item = items[props.index];

    return {
      id: item.id,
      type: item.type,
      name: item.name,
      database: item.database,
      collection: item.collection,
      lastModified: item.lastModified,
    };
  },
  {
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
  }
)(SavedItemCard);

const header = css({
  margin: spacing[3],
});

const title = css({
  marginBottom: spacing[1],
});

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
}: AggregationsQueriesListProps) => {
  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  if (loading) {
    return null;
  }

  return (
    <>
      <VirtualGrid
        itemMinWidth={CARD_WIDTH}
        itemHeight={CARD_HEIGHT + spacing[2]}
        itemsCount={items.length}
        renderItem={ConnectedItemCard}
        renderHeader={() => {
          return (
            <div className={header}>
              {/* TODO: This h1 and a subtitle might go away so that the layout */}
              {/*       is more aligned with what you see in the db / coll tabs */}
              <H2 as="h1" className={title}>
                My queries
              </H2>
              <div>All my saved queries in one place</div>
            </div>
          );
        }}
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

const mapDispatch = { fetchItems };

const connector = connect(mapState, mapDispatch);

type AggregationsQueriesListProps = ConnectedProps<typeof connector>;

export default connector(AggregationsQueriesList);
