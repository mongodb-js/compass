import React from 'react';

import { IndexKeysBadge } from '@mongodb-js/compass-components';

import TypeField from './type-field';
import SizeField from './size-field';
import UsageField from './usage-field';
import PropertyField from './property-field';
import IndexActions from './index-actions';

import { IndexesTable } from '../indexes-table';

import type {
  RegularIndex,
  RegularSortColumn,
} from '../../modules/regular-indexes';

import type { SortDirection } from '../../modules';

type RegularIndexesTableProps = {
  indexes: RegularIndex[];
  canModifyIndex: boolean;
  serverVersion: string;
  onDeleteIndex: (index: RegularIndex) => void;
  onHideIndex: (name: string) => void;
  onUnhideIndex: (name: string) => void;
  onSortTable: (column: RegularSortColumn, direction: SortDirection) => void;
};

export const RegularIndexesTable: React.FunctionComponent<
  RegularIndexesTableProps
> = ({
  indexes,
  canModifyIndex,
  serverVersion,
  onDeleteIndex,
  onHideIndex,
  onUnhideIndex,
  onSortTable,
}) => {
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
      'data-testid': `index-row-${index.name}`,
      fields: [
        {
          'data-testid': 'index-name-field',
          children: index.name,
        },
        {
          'data-testid': 'index-type-field',
          children: <TypeField type={index.type} extra={index.extra} />,
        },
        {
          'data-testid': 'index-size-field',
          children: (
            <SizeField size={index.size} relativeSize={index.relativeSize} />
          ),
        },
        {
          'data-testid': 'index-usage-field',
          children: (
            <UsageField usage={index.usageCount} since={index.usageSince} />
          ),
        },
        {
          'data-testid': 'index-property-field',
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
      details: <IndexKeysBadge keys={index.fields} />,
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
