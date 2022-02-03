import React from 'react';
import {
  useSortControls,
  useSortedItems,
  spacing,
  css,
  H2,
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

const header = css({
  margin: spacing[3],
  marginBottom: 0,
});

const title = css({
  marginBottom: spacing[1],
});

const headerStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
  paddingBottom: spacing[3],
  paddingTop: spacing[1],
});

export const useGridHeader = (
  items: Item[]
): [React.FunctionComponent, Item[]] => {
  const [filterControls, filters, search] = useGridFilters(items);
  const filteredItems = useFilteredItems(items, filters, search);

  const [sortControls, sortState] = useSortControls(sortBy);
  const sortedItems = useSortedItems(filteredItems, sortState as any);

  const GridHeader = () => {
    return (
      <div className={header}>
        <H2 as="h1" className={title}>
          My queries
        </H2>
        <div>All my saved queries in one place</div>
        <div className={headerStyles}>
          <div>{filterControls}</div>
          <div>{sortControls}</div>
        </div>
      </div>
    );
  };

  return [GridHeader as React.FunctionComponent, sortedItems];
};
