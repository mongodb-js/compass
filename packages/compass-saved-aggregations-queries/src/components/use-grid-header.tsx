import React from 'react';
import {
  spacing,
  useSortControls,
  useSortedItems,
  css,
} from '@mongodb-js/compass-components';

import {
  useTreeFilter,
  TreeState,
  Tree,
  useTextFilter,
} from './use-tree-filter';
import { Item } from '../stores/aggregations-queries-items';

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

const headerStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
  paddingLeft: spacing[3],
  paddingRight: spacing[3],
  paddingBottom: spacing[2],
  paddingTop: spacing[2],
});

const filterStyles = css({
  display: 'flex',
});

// const searchInputStyles = css({
//   width: '300px',
//   marginRight: spacing[2],
// });

export const convertItemsToTree = (items: Item[]): Tree[] => {
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
      }));

    tree.push({
      value: database,
      items: collections,
    });
  }
  return tree;
};
export function filterItems(
  items: Item[],
  conditions: TreeState,
  search: string
): Item[] {
  const filterConditions = { ...conditions };
  for (const key in filterConditions) {
    if (!filterConditions[key]) {
      delete filterConditions[key];
    }
  }
  return [...items].filter(
    (item) =>
      filterByText(item, search) && filterByConditions(item, filterConditions)
  );
}
export function filterByText(item: Item, text: string): boolean {
  if (!text) {
    return true;
  }
  const expression = new RegExp(text, 'i');
  return Boolean(expression.exec(JSON.stringify(item)));
}
export function filterByConditions(item: Item, conditions: TreeState): boolean {
  if (Object.keys(conditions).length === 0) {
    return true;
  }
  let shouldReturnItem = true;
  for (const key in conditions) {
    if (item[key] !== conditions[key]) {
      shouldReturnItem = false;
    }
  }
  return shouldReturnItem;
}

export const useGridHeader = (items: Item[]): [React.Component, Item[]] => {
  const tree = convertItemsToTree(items);
  const [filterControls, filterConditions] = useTreeFilter(tree);
  const [searchControls, search] = useTextFilter();
  const filteredItems = filterItems(items, filterConditions, search);

  const [sortControls, sortState] = useSortControls(sorts);
  const sortedItems = useSortedItems<Item>(filteredItems, sortState);

  const gridHeader = () => {
    return (
      <div className={headerStyles}>
        <div className={filterStyles}>
          {searchControls}
          {filterControls}
        </div>
        <div>{sortControls}</div>
      </div>
    );
  };

  return [gridHeader, sortedItems];
};
