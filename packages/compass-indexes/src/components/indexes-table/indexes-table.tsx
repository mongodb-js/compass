import React, { useMemo } from 'react';
import {
  css,
  Table,
  TableHeader,
  Row,
  Cell,
  cx,
} from '@mongodb-js/compass-components';
import type { IndexDirection } from 'mongodb';
import type AppRegistry from 'hadron-app-registry';

import NameField from './name-field';
import TypeField from './type-field';
import SizeField from './size-field';
import UsageField from './usage-field';
import PropertyField from './property-field';
import DropField from './drop-field';

const tableCellStyles = css({});

// When row is hovered, we show the delete button
const rowStyles = css({
  ':hover': {
    '.delete-cell': {
      visibility: 'visible',
    },
  },
});
// When row is not hovered, we hide the delete button
const deletFieldStyles = css({
  visibility: 'hidden',
});

// todo: move to redux store when converting that to ts
export type IndexModel = {
  name: string;
  fields: {
    serialize: () => { field: string; value: IndexDirection }[];
  };
  type: 'geo' | 'hashed' | 'text' | 'wildcard' | 'clustered' | 'columnstore';
  cardinality: 'single' | 'compound';
  properties: ('unique' | 'sparse' | 'partial' | 'ttl' | 'collation')[];
  extra: Record<string, string | number | JSON>;
  size: number;
  relativeSize: number;
  usageCount?: number;
  usageSince?: Date;
};

type IndexesTableProps = {
  indexes: IndexModel[];
  isReadonly: boolean;
  isWritable: boolean;
  localAppRegistry: AppRegistry;
  onSortTable: (name: string, direction: 'asc' | 'desc') => void;
};

export const IndexesTable: React.FunctionComponent<IndexesTableProps> = ({
  indexes,
  isReadonly,
  isWritable,
  localAppRegistry,
  onSortTable,
}) => {
  const columns = useMemo(() => {
    const _columns = [
      'Name and Definition',
      'Type',
      'Size',
      'Usage',
      'Properties',
    ].map((name) => {
      return (
        <TableHeader
          data-testid={`index-header-${name}`}
          label={name}
          key={name}
          handleSort={(direction) => {
            onSortTable(name, direction);
          }}
        />
      );
    });
    // The delete column
    if (!isReadonly && isWritable) {
      _columns.push(<TableHeader label={''} />);
    }
    return _columns;
  }, [isReadonly, isWritable, onSortTable]);

  return (
    <Table data={indexes} columns={columns} data-testid="index-list">
      {({ datum: index }) => (
        <Row
          key={index.name}
          data-testid={`index-row-${index.name}`}
          className={rowStyles}
        >
          <Cell className={tableCellStyles} data-testid="index-name-field">
            <NameField name={index.name} keys={index.fields.serialize()} />
          </Cell>
          <Cell className={tableCellStyles} data-testid="index-type-field">
            <TypeField type={index.type} extra={index.extra} />
          </Cell>
          <Cell className={tableCellStyles} data-testid="index-size-field">
            <SizeField size={index.size} relativeSize={index.relativeSize} />
          </Cell>
          <Cell className={tableCellStyles} data-testid="index-usage-field">
            <UsageField usage={index.usageCount} since={index.usageSince} />
          </Cell>
          <Cell className={tableCellStyles} data-testid="index-property-field">
            <PropertyField
              cardinality={index.cardinality}
              extra={index.extra}
              properties={index.properties}
            />
          </Cell>
          {/* Delete column is conditional */}
          {index.name !== '_id_' && isWritable && !isReadonly && (
            <Cell className={tableCellStyles} data-testid="index-drop-field">
              <div className={cx(deletFieldStyles, 'delete-cell')}>
                <DropField
                  name={index.name}
                  onDelete={() =>
                    localAppRegistry.emit(
                      'toggle-drop-index-modal',
                      true,
                      index.name
                    )
                  }
                />
              </div>
            </Cell>
          )}
        </Row>
      )}
    </Table>
  );
};
