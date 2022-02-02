import React, { useEffect } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import {
  VirtualGrid,
  H2,
  css,
  spacing,
  useSortControls,
  useSortedItems,
} from '@mongodb-js/compass-components';
import { fetchItems, Item } from '../stores/aggregations-queries-items';
import { RootState } from '../stores/index';
import {
  SavedItemCard,
  SavedItemCardProps,
  Action,
  CARD_WIDTH,
  CARD_HEIGHT,
} from './saved-item-card';
import { useFilteredItems, useTreeFilter } from './use-tree-filter';

const ConnectedItemCard = connect<
  Omit<SavedItemCardProps, 'onAction'>,
  Pick<SavedItemCardProps, 'onAction'>,
  { index: number; items: Item[] },
  RootState
>(
  (_state, { index, items }) => {
    const item = items[index];

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
      return () => {
        // TODO: thunk action to handle multiple possible card actions
        console.log({ id, actionName });
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

const ControlsContext = React.createContext<{
  searchControls: React.ReactElement | null;
  sortControls: React.ReactElement | null;
}>({
  searchControls: null,
  sortControls: null,
});

const GridHeader = () => {
  const { searchControls, sortControls } = React.useContext(ControlsContext);
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        paddingLeft: spacing[3],
        paddingRight: spacing[3],
        paddingBottom: spacing[2],
      }}
    >
      <div>{searchControls}</div>
      <div>{sortControls}</div>
    </div>
  );
};

const convertItemsToTree = (items: Item[]) => {
  const dbCollectionMap: Record<string, string[]> = {};
  const tree = [];
  items.forEach((item) => {
    if (!dbCollectionMap[item.database]) {
      dbCollectionMap[item.database] = [];
    }
    dbCollectionMap[item.database].push(item.collection);
  });
  for (const database in dbCollectionMap) {
    const collections = dbCollectionMap[database]
      .filter((collection, index, arr) => arr.indexOf(collection) === index)
      .map((collection) => ({
        value: collection,
        propName: 'collection',
      }));

    tree.push({
      value: database,
      propName: 'database',
      items: collections,
    });
  }
  return tree;
};

const AggregationsQueriesList = ({
  loading,
  items,
  fetchItems,
}: AggregationsQueriesListProps) => {
  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const tree = convertItemsToTree(items);
  const [treeControls, treeState] = useTreeFilter(tree);
  const filteredItems = useFilteredItems(items, treeState);

  const sorts = [
    {
      name: 'name',
      label: 'Name',
    },
    {
      name: 'lastModified',
      label: 'Last Modified',
    },
  ];
  const [sortControls, sortState] = useSortControls(sorts);
  const sortedItems = useSortedItems<Item>(filteredItems, sortState);

  const renderItem: React.ComponentProps<typeof VirtualGrid>['renderItem'] =
    React.useCallback(
      ({ index, ...props }: { index: number }) => {
        return (
          <ConnectedItemCard index={index} items={sortedItems} {...props} />
        );
      },
      [sortedItems]
    );

  if (loading) {
    return null;
  }

  return (
    <ControlsContext.Provider
      value={{
        searchControls: treeControls,
        sortControls: sortedItems.length > 0 ? sortControls : null,
      }}
    >
      <div className={header}>
        <H2 as="h1" className={title}>
          My queries
        </H2>
        <div>All my saved queries in one place</div>
      </div>
      <VirtualGrid
        itemMinWidth={CARD_WIDTH}
        itemHeight={CARD_HEIGHT + spacing[2]}
        itemsCount={sortedItems.length}
        renderItem={renderItem}
        renderHeader={GridHeader}
        classNames={{ row }}
      ></VirtualGrid>
    </ControlsContext.Provider>
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
