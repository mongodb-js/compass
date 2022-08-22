import React, { useMemo } from 'react';
import {
  css,
  Table,
  TableHeader,
  Row,
  Cell,
  cx,
  spacing,
} from '@mongodb-js/compass-components';

import NameField from './name-field';
import TypeField from './type-field';
import SizeField from './size-field';
import UsageField from './usage-field';
import PropertyField from './property-field';
import DropField from './drop-field';

// When row is hovered, we show the delete button
const rowStyles = css({
  ':hover': {
    '.delete-cell': {
      opacity: 1,
    },
  },
});
// When row is not hovered, we hide the delete button
const deleteFieldStyles = css({
  button: {
    opacity: 0,
    '&:focus': {
      opacity: 1,
    },
  },
});

const tableHeaderStyles = css({
  borderWidth: 0,
  borderBottomWidth: 3,
  '> div': {
    justifyContent: 'space-between',
  },
});

const cellStyles = css({
  verticalAlign: 'top',
});

const nameFieldStyles = css({
  paddingTop: spacing[2],
  paddingBottom: spacing[2],
});

// todo: move to redux store when converting that to ts
export type IndexModel = {
  name: string;
  fields: {
    serialize: () => { field: string; value: number | string }[];
  };
  type: 'geo' | 'hashed' | 'text' | 'wildcard' | 'clustered' | 'columnstore';
  cardinality: 'single' | 'compound';
  properties: ('unique' | 'sparse' | 'partial' | 'ttl' | 'collation')[];
  extra: Record<string, string | number | Record<string, any>>;
  size: number;
  relativeSize: number;
  usageCount?: number;
  usageSince?: Date;
};

type IndexesTableProps = {
  darkMode?: boolean;
  indexes: IndexModel[];
  canDeleteIndex: boolean;
  onSortTable: (name: string, direction: 'asc' | 'desc') => void;
  onDeleteIndex: (name: string) => void;
};

export const IndexesTable: React.FunctionComponent<IndexesTableProps> = ({
  darkMode,
  indexes,
  canDeleteIndex,
  onSortTable,
  onDeleteIndex,
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
          className={tableHeaderStyles}
          handleSort={(direction) => {
            onSortTable(name, direction);
          }}
        />
      );
    });
    // The delete column
    if (canDeleteIndex) {
      _columns.push(<TableHeader label={''} className={tableHeaderStyles} />);
    }
    return _columns;
  }, [canDeleteIndex, onSortTable]);

  return (
    <Table
      darkMode={darkMode}
      data={indexes}
      columns={columns}
      data-testid="indexes-list"
      aria-label="Indexes List Table"
    >
      {({ datum: index }) => (
        <Row
          key={index.name}
          data-testid={`index-row-${index.name}`}
          className={rowStyles}
        >
          <Cell data-testid="index-name-field" className={cellStyles}>
            <div className={nameFieldStyles}>
              <NameField
                darkMode={darkMode}
                name={index.name}
                keys={index.fields.serialize()}
              />
            </div>
          </Cell>
          <Cell data-testid="index-type-field" className={cellStyles}>
            <TypeField
              darkMode={darkMode}
              type={index.type}
              extra={index.extra}
            />
          </Cell>
          <Cell data-testid="index-size-field" className={cellStyles}>
            <SizeField
              darkMode={darkMode}
              size={index.size}
              relativeSize={index.relativeSize}
            />
          </Cell>
          <Cell data-testid="index-usage-field" className={cellStyles}>
            <UsageField
              darkMode={darkMode}
              usage={index.usageCount}
              since={index.usageSince}
            />
          </Cell>
          <Cell data-testid="index-property-field" className={cellStyles}>
            <PropertyField
              darkMode={darkMode}
              cardinality={index.cardinality}
              extra={index.extra}
              properties={index.properties}
            />
          </Cell>
          {/* Delete column is conditional */}
          {index.name !== '_id_' && canDeleteIndex && (
            <Cell data-testid="index-drop-field" className={cellStyles}>
              <div className={cx(deleteFieldStyles, 'delete-cell')}>
                <DropField
                  darkMode={darkMode}
                  name={index.name}
                  onDelete={() => onDeleteIndex(index.name)}
                />
              </div>
            </Cell>
          )}
        </Row>
      )}
    </Table>
  );
};
