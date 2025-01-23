import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Table,
  TableBody,
  TableHead,
  HeaderRow,
  HeaderCell,
  Row,
  Cell,
  css,
  useLeafyGreenTable,
  type LGColumnDef,
  type LeafyGreenTableRow,
  flexRender,
  type HeaderGroup,
  SearchInput,
  type LGTableDataType,
  getFilteredRowModel,
  type LgTableRowType,
} from '@mongodb-js/compass-components';
import type { ShardZoneData } from '../store/reducer';
import { ShardZonesDescription } from './shard-zones-description';

const containerStyles = css({
  height: '400px',
});

interface ShardZoneRow {
  locationName: string;
  zone: string;
}

interface ShardZoneExpandableRow extends ShardZoneRow {
  subRows: ShardZoneRow[];
}

const columns: Array<LGColumnDef<ShardZoneRow>> = [
  {
    accessorKey: 'locationName',
    header: 'Location Name',
    enableSorting: true,
  },
  {
    accessorKey: 'zone',
    header: 'Zone',
    enableSorting: true,
    enableGlobalFilter: false,
  },
];

const parseRow = ({
  isoCode,
  readableName,
  zoneName,
  zoneLocations,
}: ShardZoneData): ShardZoneRow => ({
  locationName: `${readableName} (${isoCode})`,
  zone: `${zoneName} (${zoneLocations.join(', ')})`,
});

const parseData = (shardZones: ShardZoneData[]): ShardZoneExpandableRow[] => {
  const grouppedZones = shardZones.reduce<
    Record<ShardZoneData['typeOneIsoCode'], ShardZoneExpandableRow>
  >((groups, next) => {
    const { typeOneIsoCode, isoCode } = next;
    groups[typeOneIsoCode] ??= { ...parseRow(next), subRows: [] };
    if (typeOneIsoCode === isoCode) {
      Object.assign(groups[typeOneIsoCode], parseRow(next));
    } else {
      groups[typeOneIsoCode].subRows.push(parseRow(next));
    }
    return groups;
  }, {});
  return Object.values(grouppedZones);
};

const hasFilteredChildren = (
  row: LgTableRowType<LGTableDataType<ShardZoneRow>>
) =>
  row.subRows.some(
    (subRow) => Object.values(subRow.columnFilters).includes(true) // columnFilters: e.g. { __global__: true }
  );

export function ShardZonesTable({
  shardZones,
}: {
  shardZones: ShardZoneData[];
}) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [expanded, setExpanded] = useState<true | Record<string, boolean>>({});

  const data = useMemo<ShardZoneExpandableRow[]>(
    () => parseData(shardZones),
    [shardZones]
  );

  const table = useLeafyGreenTable({
    containerRef: tableContainerRef,
    data,
    columns,
    state: {
      globalFilter: searchText,
      expanded,
    },
    onGlobalFilterChange: setSearchText,
    onExpandedChange: setExpanded,
    enableGlobalFilter: true,
    getFilteredRowModel: getFilteredRowModel(),
    getIsRowExpanded: (row) => {
      return (
        (searchText && hasFilteredChildren(row)) ||
        (typeof expanded !== 'boolean' && expanded[row.id])
      );
    },
    globalFilterFn: 'auto',
    filterFromLeafRows: true,
    maxLeafRowFilterDepth: 2,
  });

  const tableRef = useRef(table);
  tableRef.current = table;

  const handleSearchTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      tableRef.current.setGlobalFilter(e.currentTarget?.value || '');
    },
    [tableRef]
  );

  const { rows } = table.getRowModel();

  return (
    <>
      <ShardZonesDescription />
      <SearchInput
        value={searchText}
        onChange={handleSearchTextChange}
        aria-label="Search for a location"
        placeholder="Search for a location"
      />
      <Table
        className={containerStyles}
        title="Zone Mapping"
        table={table}
        ref={tableContainerRef}
      >
        <TableHead isSticky>
          {table
            .getHeaderGroups()
            .map((headerGroup: HeaderGroup<ShardZoneRow>) => (
              <HeaderRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <HeaderCell key={header.id} header={header}>
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
          {rows.map((row: LeafyGreenTableRow<ShardZoneRow>) => (
            <Row key={row.id} row={row}>
              {row.getVisibleCells().map((cell) => {
                return (
                  <Cell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Cell>
                );
              })}
              {row.subRows.map((subRow) => (
                <Row key={subRow.id} row={subRow}>
                  {subRow.getVisibleCells().map((cell) => {
                    return (
                      <Cell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </Cell>
                    );
                  })}
                </Row>
              ))}
            </Row>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
