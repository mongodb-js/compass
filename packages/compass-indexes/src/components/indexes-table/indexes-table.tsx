import React, { useMemo, useRef, useEffect } from 'react';
import {
  css,
  Table,
  TableHeader,
  Row,
  Cell,
  cx,
  spacing,
  uiColors,
} from '@mongodb-js/compass-components';

import NameField from './name-field';
import TypeField from './type-field';
import SizeField from './size-field';
import UsageField from './usage-field';
import PropertyField from './property-field';
import type {
  IndexDefinition,
  SortColumn,
  SortDirection,
} from '../../modules/indexes';
import IndexActions from './index-actions';

// When row is hovered, we show the delete button
const rowStyles = css({
  ':hover': {
    '.index-actions-cell': {
      button: {
        opacity: 1,
      },
    },
  },
});

// When row is not hovered, we hide the delete button
const indexActionsCellStyles = css({
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

const tableStyles = css({
  thead: {
    position: 'sticky',
    top: 0,
    background: uiColors.white,
    zIndex: 1,
  },
});

type IndexesTableProps = {
  indexes: IndexDefinition[];
  canDeleteIndex: boolean;
  scrollHeight: number;
  onSortTable: (column: SortColumn, direction: SortDirection) => void;
  onDeleteIndex: (name: IndexDefinition) => void;
};

export const IndexesTable: React.FunctionComponent<IndexesTableProps> = ({
  indexes,
  canDeleteIndex,
  scrollHeight,
  onSortTable,
  onDeleteIndex,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const container =
      containerRef.current?.getElementsByTagName('table')[0]?.parentElement;
    if (container) {
      container.style.height = `${scrollHeight}px`;
    }
  }, [scrollHeight]);

  return (
    // LG table does not forward ref
    <div ref={containerRef}>
      <Table
        className={tableStyles}
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
            {/* Delete column is conditional */}
            {canDeleteIndex && (
              <Cell data-testid="index-actions-field" className={cellStyles}>
                {index.name !== '_id_' && index.extra.status !== 'inprogress' && (
                  <div
                    className={cx(indexActionsCellStyles, 'index-actions-cell')}
                  >
                    <IndexActions
                      index={index}
                      onDeleteIndex={onDeleteIndex}
                    ></IndexActions>
                  </div>
                )}
              </Cell>
            )}
          </Row>
        )}
      </Table>
    </div>
  );
};
