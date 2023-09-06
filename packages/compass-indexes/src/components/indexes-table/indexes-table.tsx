import React, { useMemo, useRef, useEffect } from 'react';
import {
  css,
  Table,
  TableHeader,
  Row,
  Cell,
  cx,
  spacing,
  palette,
  IndexKeysBadge,
  KeylineCard,
  useDOMRect,
} from '@mongodb-js/compass-components';

import TypeField from './type-field';
import SizeField from './size-field';
import UsageField from './usage-field';
import PropertyField from './property-field';
import type {
  IndexDefinition,
  SortColumn,
  SortDirection,
} from '../../modules/regular-indexes';
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
  verticalAlign: 'middle',
});

const nestedRowCellStyles = css({
  padding: 0,
});

const tableStyles = css({
  thead: {
    position: 'sticky',
    top: 0,
    background: palette.white,
    zIndex: 5,
  },
});

const cardStyles = css({
  padding: spacing[3],
});

const spaceProviderStyles = css({
  flex: 1,
  position: 'relative',
  overflow: 'hidden',
});

type IndexesTableProps = {
  indexes: IndexDefinition[];
  canModifyIndex: boolean;
  serverVersion: string;
  onSortTable: (column: SortColumn, direction: SortDirection) => void;
  onDeleteIndex: (index: IndexDefinition) => void;
  onHideIndex: (name: string) => void;
  onUnhideIndex: (name: string) => void;
};

export const IndexesTable: React.FunctionComponent<IndexesTableProps> = ({
  indexes,
  canModifyIndex,
  serverVersion,
  onSortTable,
  onDeleteIndex,
  onHideIndex,
  onUnhideIndex,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rectProps, { height: availableHeightInContainer }] = useDOMRect();
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
    // Actions column
    if (canModifyIndex) {
      _columns.push(<TableHeader label={''} className={tableHeaderStyles} />);
    }
    return _columns;
  }, [canModifyIndex, onSortTable]);

  useEffect(() => {
    /**
     * For table header to be sticky, the wrapper element of table needs to have
     * a height. LG wraps table in a div at multiple levels, so height can not
     * be applied directly to the wrapper we have in this markup which is why we
     * look for the parent element to apply the height.
     */
    const table = cardRef.current?.getElementsByTagName('table')[0];
    const tableParent = table?.parentElement;

    if (table && tableParent) {
      // We add a top and bottom padding of spacing[3] and our root container
      // has a bottom margin of spacing[3] which is why the actual usable
      // height of the container is less than what we get here
      const heightWithoutSpacing = availableHeightInContainer - spacing[3] * 3;

      // This will be the height of the table. We take whichever is the max of
      // the actual table height vs the half of the height available to make
      // sure that our table does not always render in a super small keyline
      // card when there are only a few rows in the table.
      const tableHeight = Math.max(
        table.clientHeight,
        heightWithoutSpacing / 2
      );

      // When we have enough space available to render the table, we simply want
      // our keyline card to have a height as much as that of the table content
      const tableParentHeight = Math.max(
        0,
        Math.min(tableHeight, heightWithoutSpacing)
      );
      tableParent.style.height = `${tableParentHeight}px`;
    }
  }, [availableHeightInContainer]);

  return (
    <div className={spaceProviderStyles} {...rectProps}>
      <KeylineCard ref={cardRef} data-testid="indexes" className={cardStyles}>
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
                {index.name}
              </Cell>
              <Cell data-testid="index-type-field" className={cellStyles}>
                <TypeField type={index.type} extra={index.extra} />
              </Cell>
              <Cell data-testid="index-size-field" className={cellStyles}>
                <SizeField
                  size={index.size}
                  relativeSize={index.relativeSize}
                />
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
                  {index.name !== '_id_' &&
                    index.extra.status !== 'inprogress' && (
                      <div
                        className={cx(
                          indexActionsCellStyles,
                          'index-actions-cell'
                        )}
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
          )}
        </Table>
      </KeylineCard>
    </div>
  );
};
