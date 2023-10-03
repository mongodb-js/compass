import React from 'react';
import { connect } from 'react-redux';
import { IndexKeysBadge } from '@mongodb-js/compass-components';
import { withPreferences } from 'compass-preferences-model';

import type { RootState } from '../../modules';

import { IndexesTable } from '../indexes-table';

import TypeField from './type-field';
import SizeField from './size-field';
import UsageField from './usage-field';
import PropertyField from './property-field';
import IndexActions from './index-actions';

import {
  sortRegularIndexes,
  dropIndex,
  hideIndex,
  unhideIndex,
} from '../../modules/regular-indexes';

import {
  type RegularIndex,
  type RegularSortColumn,
} from '../../modules/regular-indexes';

import type { SortDirection } from '../../modules';

type RegularIndexesTableProps = {
  indexes: RegularIndex[];
  serverVersion: string;
  isWritable?: boolean;
  onHideIndex: (name: string) => void;
  onUnhideIndex: (name: string) => void;
  onSortTable: (column: RegularSortColumn, direction: SortDirection) => void;
  onDeleteIndex: (name: string) => void;
  readOnly?: boolean;
  error?: string | null;
};

export const RegularIndexesTable: React.FunctionComponent<
  RegularIndexesTableProps
> = ({
  isWritable,
  readOnly,
  indexes,
  serverVersion,
  onHideIndex,
  onUnhideIndex,
  onSortTable,
  onDeleteIndex,
  error,
}) => {
  if (error) {
    // We don't render the table if there is an error. The toolbar takes care of
    // displaying it.
    return null;
  }

  const canModifyIndex = isWritable && !readOnly;

  const columns = [
    'Name and Definition',
    'Type',
    'Size',
    'Usage',
    'Properties',
  ] as const;

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
          'data-testid': 'type-field',
          children: <TypeField type={index.type} extra={index.extra} />,
        },
        {
          'data-testid': 'size-field',
          children: (
            <SizeField size={index.size} relativeSize={index.relativeSize} />
          ),
        },
        {
          'data-testid': 'usage-field',
          children: (
            <UsageField usage={index.usageCount} since={index.usageSince} />
          ),
        },
        {
          'data-testid': 'property-field',
          children: (
            <PropertyField
              cardinality={index.cardinality}
              extra={index.extra}
              properties={index.properties}
            />
          ),
        },
      ],
      actions: index.name !== '_id_' && index.extra.status !== 'inprogress' && (
        <IndexActions
          index={index}
          serverVersion={serverVersion}
          onDeleteIndex={onDeleteIndex}
          onHideIndex={onHideIndex}
          onUnhideIndex={onUnhideIndex}
        ></IndexActions>
      ),
      details: (
        <IndexKeysBadge
          keys={index.fields}
          data-testid={`indexes-details-${index.name}`}
        />
      ),
    };
  });

  return (
    <IndexesTable
      data-testid="indexes"
      aria-label="Indexes"
      canModifyIndex={canModifyIndex}
      columns={columns}
      data={data}
      onSortTable={(column, direction) => onSortTable(column, direction)}
    />
  );
};

const mapState = ({
  serverVersion,
  regularIndexes,
  isWritable,
}: RootState) => ({
  isWritable,
  serverVersion,
  indexes: regularIndexes.indexes,
  error: regularIndexes.error,
});

const mapDispatch = {
  onDeleteIndex: dropIndex,
  onHideIndex: hideIndex,
  onUnhideIndex: unhideIndex,
  onSortTable: sortRegularIndexes,
};

export default connect(
  mapState,
  mapDispatch
)(withPreferences(RegularIndexesTable, ['readOnly'], React));
