import React, { useMemo } from 'react';

import { IndexKeysBadge } from '@mongodb-js/compass-components';

import TypeField from './type-field';
import SizeField from './size-field';
import UsageField from './usage-field';
import PropertyField from './property-field';
import IndexActions from './index-actions';

import {
  IndexesTable,
  IndexRow,
  IndexCell,
  IndexHeader,
  IndexActionsField,
  IndexKeys,
} from '../indexes-table';

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
  onSortTable: (column: SortColumn, direction: SortDirection) => void;
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
  const columns = useMemo(() => {
    const sortColumns: SortColumn[] = [
      'Name and Definition',
      'Type',
      'Size',
      'Usage',
      'Properties',
    ];
    const _columns = sortColumns.map((name) => {
      return (
        <IndexHeader
          data-testid={`index-header-${name}`}
          label={name}
          key={name}
          handleSort={(direction: SortDirection) => {
            onSortTable(name, direction);
          }}
        />
      );
    });
    // Actions column
    if (canModifyIndex) {
      _columns.push(<IndexHeader label={''} />);
    }
    return _columns;
  }, [canModifyIndex, onSortTable]);

  return (
    <IndexesTable<IndexDefinition>
      data-testid="indexes"
      aria-label="Indexes"
      columns={columns}
      data={indexes}
    >
      {({ datum: index }) => {
        return (
          <IndexRow key={index.name} data-testid={`index-row-${index.name}`}>
            <IndexCell data-testid="index-name-field">{index.name}</IndexCell>
            <IndexCell data-testid="index-type-field">
              <TypeField type={index.type} extra={index.extra} />
            </IndexCell>
            <IndexCell data-testid="index-size-field">
              <SizeField size={index.size} relativeSize={index.relativeSize} />
            </IndexCell>
            <IndexCell data-testid="index-usage-field">
              <UsageField usage={index.usageCount} since={index.usageSince} />
            </IndexCell>
            <IndexCell data-testid="index-property-field">
              <PropertyField
                cardinality={index.cardinality}
                extra={index.extra}
                properties={index.properties}
              />
            </IndexCell>
            {/* Index actions column is conditional */}
            {canModifyIndex && (
              <IndexCell data-testid="index-actions-field">
                {index.name !== '_id_' && index.extra.status !== 'inprogress' && (
                  <IndexActionsField>
                    <IndexActions
                      index={index}
                      serverVersion={serverVersion}
                      onDeleteIndex={onDeleteIndex}
                      onHideIndex={onHideIndex}
                      onUnhideIndex={onUnhideIndex}
                    ></IndexActions>
                  </IndexActionsField>
                )}
              </IndexCell>
            )}
            <IndexKeys colSpan={canModifyIndex ? 6 : 5}>
              <IndexKeysBadge keys={index.fields} />
            </IndexKeys>
          </IndexRow>
        );
      }}
    </IndexesTable>
  );
};
