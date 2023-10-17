import React, { useMemo, useRef, useEffect } from 'react';
import {
  css,
  cx,
  Table,
  TableHeader,
  Row,
  Cell,
  spacing,
  palette,
  KeylineCard,
  useDOMRect,
} from '@mongodb-js/compass-components';

import type { SortDirection } from '../../modules';

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

const indexActionsCellContainerStyles = css({
  display: 'flex',
  justifyContent: 'flex-end',
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

type IndexInfo = {
  key: string;
  'data-testid': string;
  fields: {
    key?: string;
    'data-testid': string;
    children: React.ReactNode;
    className?: string;
  }[];
  actions?: React.ReactNode;
  details?: React.ReactNode;
};

export type IndexesTableProps<Column extends string> = {
  ['data-testid']: string;
  ['aria-label']: string;
  columns: readonly Column[];
  data: IndexInfo[];
  canModifyIndex?: boolean;
  onSortTable: (column: Column, direction: SortDirection) => void;
};

export function IndexesTable<Column extends string>({
  ['data-testid']: dataTestId,
  ['aria-label']: ariaLabel,
  columns: sortColumns,
  canModifyIndex,
  data,
  onSortTable,
}: IndexesTableProps<Column>) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rectProps, { height: availableHeightInContainer }] = useDOMRect();

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

  const columns = useMemo(() => {
    const _columns = sortColumns.map((name) => {
      return (
        <TableHeader
          data-testid={`${dataTestId}-header-${name}`}
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
  }, [canModifyIndex, onSortTable, sortColumns]);

  return (
    <div className={spaceProviderStyles} {...rectProps}>
      <KeylineCard
        ref={cardRef}
        data-testid={dataTestId}
        className={cardStyles}
      >
        <Table
          className={tableStyles}
          columns={columns}
          data={data}
          data-testid={`${dataTestId}-list`}
          aria-label={`${ariaLabel} List Table`}
        >
          {({ datum: info, index }) => {
            return (
              <Row
                key={info.key}
                data-testid={`${dataTestId}-${info['data-testid']}`}
                className={rowStyles}
              >
                {info.fields.map((field) => {
                  return (
                    <Cell
                      key={field.key ?? `${info.key}-${index}`}
                      data-testid={`${dataTestId}-${field['data-testid']}`}
                      className={cx(cellStyles, field.className)}
                    >
                      {field.children}
                    </Cell>
                  );
                })}
                {/* Index actions column is conditional */}
                {canModifyIndex && (
                  <Cell
                    data-testid={`${dataTestId}-actions-field`}
                    className={cx(cellStyles, indexActionsCellContainerStyles)}
                  >
                    {info.actions && (
                      <div
                        className={cx(
                          indexActionsCellStyles,
                          'index-actions-cell'
                        )}
                      >
                        {info.actions}
                      </div>
                    )}
                  </Cell>
                )}
                {info.details && (
                  <Row>
                    <Cell
                      className={cx(nestedRowCellStyles, cellStyles)}
                      colSpan={
                        canModifyIndex
                          ? info.fields.length + 1
                          : info.fields.length
                      }
                    >
                      {info.details}
                    </Cell>
                  </Row>
                )}
              </Row>
            );
          }}
        </Table>
      </KeylineCard>
    </div>
  );
}
