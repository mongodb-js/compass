import React from 'react';

import type { SearchIndex } from 'mongodb-data-service';

import { IndexesTable } from '../indexes-table';

import type {
  SearchSortColumn,
  SortDirection,
} from '../../modules/search-indexes';

type SearchIndexesTableProps = {
  indexes: SearchIndex[];
  canModifyIndex: boolean;
  onSortTable: (column: SearchSortColumn, direction: SortDirection) => void;
};

export const SearchIndexesTable: React.FunctionComponent<
  SearchIndexesTableProps
> = ({ indexes, canModifyIndex, onSortTable }) => {
  const columns = ['Name and Fields', 'Status'] as const;

  const data = indexes.map((index) => {
    return {
      key: index.name,
      'data-testid': `index-row-${index.name}`,
      fields: [
        {
          'data-testid': 'index-name-field',
          children: index.name,
        },
        {
          'data-testid': 'index-status-field',
          children: index.status, // TODO
        },
      ],
    };
  });

  return (
    <IndexesTable
      data-testid="search-indexes"
      aria-label="Search Indexes"
      canModifyIndex={canModifyIndex}
      columns={columns}
      data={data}
      onSortTable={(column, direction) => onSortTable(column, direction)}
    />
  );
};
