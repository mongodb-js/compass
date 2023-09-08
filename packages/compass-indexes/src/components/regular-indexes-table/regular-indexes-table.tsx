import React from 'react';

import { IndexKeysBadge } from '@mongodb-js/compass-components';

import TypeField from './type-field';
import SizeField from './size-field';
import UsageField from './usage-field';
import PropertyField from './property-field';
import IndexActions from './index-actions';

import { IndexesTable } from '../indexes-table';

import type {
  IndexDefinition,
  SortColumn,
  SortDirection,
} from '../../modules/regular-indexes';

type RegularIndexesTableProps = {
  indexes: IndexDefinition[];
  canModifyIndex: boolean;
  serverVersion: string;
  onDeleteIndex: (index: IndexDefinition) => void;
  onHideIndex: (name: string) => void;
  onUnhideIndex: (name: string) => void;
  onSortable: (column: SortColumn, direction: SortDirection) => void;
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
  onSortable,
}) => {
  const columns = [
    'Name and Definition',
    'Type',
    'Size',
    'Usage',
    'Properties',
  ];

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
      onSortable={(column: string, direction: SortDirection) =>
        onSortable(column as SortColumn, direction)
      }
    />
  );
};
