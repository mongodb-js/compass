import React from 'react';
import {
  useSortControls,
  useSortedItems,
  spacing,
  css,
} from '@mongodb-js/compass-components';

import { useGridFilters, useFilteredItems } from './use-grid-filters';
import type { Item } from '../stores/aggregations-queries-items';

const sortBy: { name: Extract<keyof Item, string>; label: string }[] = [
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

export const useGridHeader = (
  items: Item[]
): [React.FunctionComponent, Item[]] => {
  const [filterControls, filters, search] = useGridFilters(items);
  const filteredItems = useFilteredItems(items, filters, search);

  const [sortControls, sortState] = useSortControls(sortBy);
  const sortedItems = useSortedItems(filteredItems, sortState as any);

  const gridHeader = () => {
    return (
      <div className={headerStyles}>
        <div>{filterControls}</div>
        <div>{sortControls}</div>
      </div>
    );
  };

  return [gridHeader as React.FunctionComponent, sortedItems];
};
