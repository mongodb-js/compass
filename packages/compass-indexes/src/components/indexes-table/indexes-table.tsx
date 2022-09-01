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
import type {
  IndexDefinition,
  SortColumn,
  SortDirection,
} from '../../modules/indexes';

// When row is hovered, we show the delete button
const rowStyles = css({
  ':hover': {
    '.delete-cell': {
      button: {
        opacity: 1,
      },
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
  minWidth: spacing[5],
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

type IndexesTableProps = {
  darkMode?: boolean;
  indexes: IndexDefinition[];
  canDeleteIndex: boolean;
  onSortTable: (column: SortColumn, direction: SortDirection) => void;
  onDeleteIndex: (index: IndexDefinition) => void;
};

export const IndexesTable: React.FunctionComponent<IndexesTableProps> = ({
  indexes,
  canDeleteIndex,
  onSortTable,
  onDeleteIndex,
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
              <NameField name={index.name} keys={index.fields.serialize()} />
            </div>
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
          <Cell data-testid="index-drop-field" className={cellStyles}>
            <div className={cx(deleteFieldStyles, 'delete-cell')}>
              {index.name !== '_id_' &&
                index.extra.status !== 'inprogress' &&
                canDeleteIndex && (
                  <DropField
                    name={index.name}
                    onDelete={() => onDeleteIndex(index)}
                  />
                )}
            </div>
          </Cell>
        </Row>
      )}
    </Table>
  );
};
