import React from 'react';
import { connect } from 'react-redux';
import type { SearchIndex } from 'mongodb-data-service';
import { withPreferences } from 'compass-preferences-model';

import type { SearchSortColumn } from '../../modules/search-indexes';
import { SearchIndexesStatuses } from '../../modules/search-indexes';
import type { SearchIndexesStatus } from '../../modules/search-indexes';
import { sortSearchIndexes } from '../../modules/search-indexes';
import type { SortDirection, RootState } from '../../modules';

import { IndexesTable } from '../indexes-table';

type SearchIndexesTableProps = {
  indexes: SearchIndex[];
  isWritable?: boolean;
  isReadonlyView?: boolean;
  readOnly?: boolean;
  onSortTable: (column: SearchSortColumn, direction: SortDirection) => void;
  status: SearchIndexesStatus;
};

export const SearchIndexesTable: React.FunctionComponent<
  SearchIndexesTableProps
> = ({
  indexes,
  isWritable,
  isReadonlyView,
  readOnly,
  onSortTable,
  status,
}) => {
  if (isReadonlyView) {
    // TODO: There is no design for this. We simply don't show the table
    return null;
  }

  if (status !== SearchIndexesStatuses.READY) {
    // If there's an error or we're refreshing or the search indexes are still
    // pending or search indexes aren't available, then that's all handled by
    // the toolbar and we don't render the table.
    return null;
  }

  if (indexes.length === 0) {
    // TODO(COMPASS-7204): render the zero state
    return null;
  }

  const canModifyIndex = isWritable && !readOnly;

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
          children: index.status, // TODO(COMPASS-7205): show some badge, not just text
        },
      ],

      // TODO(COMPASS-7206): details for the nested row
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

const mapState = ({
  searchIndexes,
  isWritable,
  isReadonlyView,
}: RootState) => ({
  isWritable,
  isReadonlyView,
  indexes: searchIndexes.indexes,
  status: searchIndexes.status,
});

const mapDispatch = {
  onSortTable: sortSearchIndexes,
};

export default connect(
  mapState,
  mapDispatch
)(withPreferences(SearchIndexesTable, ['readOnly'], React));
