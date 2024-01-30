import React from 'react';
import {
  css,
  cx,
  ExpandedContent,
  HeaderCell,
  HeaderRow,
  Table,
  TableBody,
  TableHead,
  Row,
  Cell,
  spacing,
  palette,
  flexRender,
  useLeafyGreenTable,
} from '@mongodb-js/compass-components';
import type {
  LGColumnDef,
  LGTableDataType,
  HeaderGroup,
  LeafyGreenTableCell,
  LeafyGreenTableRow,
} from '@mongodb-js/compass-components';
import { useDarkMode } from '@mongodb-js/compass-components';

const tableStyles = css({
  // Required for the `sticky` header.
  height: '100%',
});

const indexActionsCellClassName = 'index-actions-cell';

// When row is hovered, we show the delete button
const rowStyles = css({
  ':hover': {
    [`.${indexActionsCellClassName}`]: {
      button: {
        opacity: 1,
      },
    },
  },
});

// When row is not hovered, we hide the delete button
const indexActionsCellStyles = css({
  display: 'flex',
  justifyContent: 'flex-end',
  button: {
    opacity: 0,
    '&:focus': {
      opacity: 1,
    },
  },
  minWidth: spacing[5],
});

const tableHeadRowStyles = css({
  position: 'sticky',
  top: 0,
  zIndex: 5,
  background: palette.white,
});

const tableHeadRowDarkModeStyles = css({
  background: palette.black,
});

const tableHeadCellStyles = css({
  '> div': {
    // Push the sort button to the right of the head cell.
    justifyContent: 'space-between',
  },
});

export type IndexesTableProps<T> = {
  ['data-testid']: string;
  columns: LGColumnDef<T>[];
  data: LGTableDataType<T>[];
};

export function IndexesTable<T>({
  ['data-testid']: dataTestId,
  columns,
  data,
}: IndexesTableProps<T>) {
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const table = useLeafyGreenTable<T>({
    containerRef: tableContainerRef,
    data,
    columns,
    debugTable: true,
    enableExpanding: true,
  });

  const { rows } = table.getRowModel();

  const darkMode = useDarkMode();

  return (
    <Table
      className={tableStyles}
      data-testid={`${dataTestId}-list`}
      table={table}
      ref={tableContainerRef}
    >
      <TableHead>
        {table.getHeaderGroups().map((headerGroup: HeaderGroup<T>) => (
          <HeaderRow
            className={cx(
              tableHeadRowStyles,
              darkMode && tableHeadRowDarkModeStyles
            )}
            key={headerGroup.id}
          >
            {headerGroup.headers.map((header) => {
              return (
                <HeaderCell
                  className={tableHeadCellStyles}
                  data-testid={`${dataTestId}-header-${header.id}`}
                  key={header.id}
                  header={header}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </HeaderCell>
              );
            })}
          </HeaderRow>
        ))}
      </TableHead>
      <TableBody>
        {rows.map((row: LeafyGreenTableRow<T>) => {
          return (
            <Row
              className={rowStyles}
              key={row.id}
              row={row}
              data-testid={`${dataTestId}-row-${row.id}`}
            >
              {row.getVisibleCells().map((cell: LeafyGreenTableCell<T>) => {
                return (
                  <Cell
                    className={cx(
                      cell.column.id === 'actions' && indexActionsCellStyles,
                      cell.column.id === 'actions' && indexActionsCellClassName
                    )}
                    data-testid={`${dataTestId}-${cell.column.id}-field`}
                    key={cell.id}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Cell>
                );
              })}

              {row.original.renderExpandedContent && (
                <ExpandedContent row={row} />
              )}
            </Row>
          );
        })}
      </TableBody>
    </Table>
  );
}
