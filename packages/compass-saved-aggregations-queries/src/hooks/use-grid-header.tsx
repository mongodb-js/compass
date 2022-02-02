import React from 'react';
import {
  spacing,
  useSortControls,
  useSortedItems,
  css,
} from '@mongodb-js/compass-components';

import { useGridFilters, useFilteredItems } from './use-grid-filters';
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

export const useGridHeader = (items: Item[]): [React.Component, Item[]] => {
  const [filterControls, filters, search] = useGridFilters(items);
  const filteredItems = useFilteredItems(items, filters, search);

  const [sortControls, sortState] = useSortControls(sorts);
  const sortedItems = useSortedItems<Item>(filteredItems, sortState);

  const gridHeader = () => {
    return (
      <div className={headerStyles}>
        <div>{filterControls}</div>
        <div>{sortControls}</div>
      </div>
    );
  };

  return [gridHeader, sortedItems];
};
