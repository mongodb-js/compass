import React from 'react';
import { connect } from 'react-redux';
import type { SearchIndex } from 'mongodb-data-service';
import { withPreferences } from 'compass-preferences-model';

import type { SearchSortColumn } from '../../modules/search-indexes';
import {
  SearchIndexesStatuses,
  showDropSearchIndexModal,
} from '../../modules/search-indexes';
import type { SearchIndexesStatus } from '../../modules/search-indexes';
import { sortSearchIndexes } from '../../modules/search-indexes';
import type { SortDirection, RootState } from '../../modules';

import { IndexesTable } from '../indexes-table';
import IndexActions from './search-index-actions';

type SearchIndexesTableProps = {
  indexes: SearchIndex[];
  isWritable?: boolean;
  readOnly?: boolean;
  onSortTable: (column: SearchSortColumn, direction: SortDirection) => void;
  onDropIndex: (name: string) => void;
  status: SearchIndexesStatus;
};

function isReadyStatus(status: SearchIndexesStatus) {
  return (
    status === SearchIndexesStatuses.READY ||
    status === SearchIndexesStatuses.REFRESHING
  );
}

export const SearchIndexesTable: React.FunctionComponent<
  SearchIndexesTableProps
> = ({ indexes, isWritable, readOnly, onSortTable, status, onDropIndex }) => {
  if (!isReadyStatus(status)) {
    // If there's an error or the search indexes are still pending or search
    // indexes aren't available, then that's all handled by the toolbar and we
    // don't render the table.
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
      'data-testid': `row-${index.name}`,
      fields: [
        {
          'data-testid': 'name-field',
          children: index.name,
        },
        {
          'data-testid': 'status-field',
          children: index.status, // TODO(COMPASS-7205): show some badge, not just text
        },
      ],
      actions: <IndexActions index={index} onDropIndex={onDropIndex} />,
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

const mapState = ({ searchIndexes, isWritable }: RootState) => ({
  isWritable,
  indexes: searchIndexes.indexes,
  status: searchIndexes.status,
});

const mapDispatch = {
  onSortTable: sortSearchIndexes,
  onDropIndex: showDropSearchIndexModal,
};

export default connect(
  mapState,
  mapDispatch
)(withPreferences(SearchIndexesTable, ['readOnly'], React));
