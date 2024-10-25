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
  Subtitle,
  Body,
  spacing,
  Link,
} from '@mongodb-js/compass-components';
import type { ShardZoneData } from '../store/reducer';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';

const containerStyles = css({
  height: '400px',
});

const paragraphStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
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

  const { atlasMetadata } = useConnectionInfo();

  const { rows } = table.getRowModel();

  return (
    <>
      <Subtitle>Location Codes</Subtitle>
      <div className={paragraphStyles}>
        <Body>
          Each document’s first field should include an ISO 3166-1 Alpha-2 code
          for the location it belongs to.
        </Body>
        <Body>
          We also support ISO 3166-2 subdivision codes for countries containing
          a cloud provider data center (both ISO 3166-1 and ISO 3166-2 codes may
          be used for these countries). All valid country codes and the zones to
          which they map are listed in the table below. Additionally, you can
          view a list of all location codes{' '}
          <Link href="/static/atlas/country_iso_codes.txt">here</Link>.
        </Body>
        <Body>
          {atlasMetadata?.projectId && atlasMetadata?.clusterName && (
            <>
              Locations’ zone mapping can be changed by navigating to this
              clusters{' '}
              <Link
                href={`/v2/${atlasMetadata?.projectId}#/clusters/edit/${atlasMetadata?.clusterName}`}
              >
                Edit Configuration
              </Link>{' '}
              page and clicking the Configure Location Mappings’ link above the
              map.
            </>
          )}
        </Body>
      </div>
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
