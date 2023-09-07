import React, { useMemo } from 'react';

import {
  TableHeader,
  Row,
  Cell,
  cx,
  IndexKeysBadge,
} from '@mongodb-js/compass-components';

import TypeField from './type-field';
import SizeField from './size-field';
import UsageField from './usage-field';
import PropertyField from './property-field';
import IndexActions from './index-actions';

import {
  rowStyles,
  indexActionsCellStyles,
  tableHeaderStyles,
  cellStyles,
  nestedRowCellStyles,
  IndexesTable,
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
        <TableHeader
          data-testid={`index-header-${name}`}
          label={name}
          key={name}
          className={tableHeaderStyles}
          handleSort={(direction: SortDirection) => {
            onSortTable(name, direction);
          }}
        />
      );
    });
    // Actions column
    if (canModifyIndex) {
      _columns.push(<TableHeader label={''} className={tableHeaderStyles} />);
    }
    return _columns;
  }, [canModifyIndex, onSortTable]);

  return (
    <IndexesTable<IndexDefinition> columns={columns} data={indexes}>
      {({ datum: index }) => {
        return (
          <Row
            key={index.name}
            data-testid={`index-row-${index.name}`}
            className={rowStyles}
          >
            <Cell data-testid="index-name-field" className={cellStyles}>
              {index.name}
            </Cell>
            <Cell data-testid="index-type-field" className={cellStyles}>
              <TypeField type={index.type} extra={index.extra} />
            </Cell>
            <Cell data-testid="index-size-field" className={cellStyles}>
              <SizeField size={index.size} relativeSize={index.relativeSize} />
            </Cell>
            <Cell data-testid="index-usage-field" className={cellStyles}>
              <UsageField usage={index.usageCount} since={index.usageSince} />
            </Cell>
            <Cell data-testid="index-property-field" className={cellStyles}>
              <PropertyField
                cardinality={index.cardinality}
                extra={index.extra}
                properties={index.properties}
              />
            </Cell>
            {/* Index actions column is conditional */}
            {canModifyIndex && (
              <Cell data-testid="index-actions-field" className={cellStyles}>
                {index.name !== '_id_' && index.extra.status !== 'inprogress' && (
                  <div
                    className={cx(indexActionsCellStyles, 'index-actions-cell')}
                  >
                    <IndexActions
                      index={index}
                      serverVersion={serverVersion}
                      onDeleteIndex={onDeleteIndex}
                      onHideIndex={onHideIndex}
                      onUnhideIndex={onUnhideIndex}
                    ></IndexActions>
                  </div>
                )}
              </Cell>
            )}
            <Row>
              <Cell
                className={cx(nestedRowCellStyles, cellStyles)}
                colSpan={canModifyIndex ? 6 : 5}
              >
                <IndexKeysBadge keys={index.fields} />
              </Cell>
            </Row>
          </Row>
        );
      }}
    </IndexesTable>
  );
};
