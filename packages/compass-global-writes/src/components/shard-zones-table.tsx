import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
} from '@mongodb-js/compass-components';
import type { ShardZoneData } from '../store/reducer';

const containerStyles = css({
  height: '400px',
});

interface ShardZoneRow {
  locationName: string;
  zone: string;
  searchable: string;
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
  searchable: readableName,
});

const parseData = (shardZones: ShardZoneData[]): ShardZoneExpandableRow[] => {
  const grouppedZones = shardZones.reduce<
    Record<ShardZoneData['typeOneIsoCode'], ShardZoneExpandableRow>
  >((groups, next) => {
    const { typeOneIsoCode, isoCode } = next;
    if (!groups[typeOneIsoCode]) {
      groups[typeOneIsoCode] = { ...parseRow(next), subRows: [] };
    }
    if (typeOneIsoCode === isoCode) {
      Object.assign(groups[typeOneIsoCode], parseRow(next));
    } else {
      groups[typeOneIsoCode].subRows.push(parseRow(next));
    }
    return groups;
  }, {});
  return Object.values(grouppedZones);
};

export function ShardZonesTable({
  shardZones,
}: {
  shardZones: ShardZoneData[];
}) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [searchText, setSearchText] = useState<string>('');
  const handleSearchTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(e.currentTarget.value);
    },
    [setSearchText]
  );

  const data = useMemo<ShardZoneExpandableRow[]>(
    () => parseData(shardZones),
    [shardZones]
  );

  const filteredData = useMemo<ShardZoneExpandableRow[]>(
    () =>
      data.reduce<ShardZoneExpandableRow[]>((filtered, next) => {
        const { searchable, subRows } = next;
        if (searchable.includes(searchText)) {
          filtered.push(next);
          return filtered;
        }
        const matchingSubRows = subRows.filter((subRow) =>
          subRow.searchable.includes(searchText)
        );
        if (matchingSubRows.length > 0) {
          filtered.push({
            ...next,
            subRows: matchingSubRows,
          });
        }
        return filtered;
      }, []),
    [data, searchText]
  );

  const table = useLeafyGreenTable({
    containerRef: tableContainerRef,
    data: filteredData,
    columns,
  });

  const { rows } = table.getRowModel();

  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  useEffect(() => {
    if (!searchText) return;
    for (const row of rowsRef.current) {
      if (row.subRows.length && !row.getIsExpanded()) {
        console.log('expanding row', row.original, row.getIsExpanded());
        row.toggleExpanded();
      }
    }
  }, [searchText, rowsRef]);

  return (
    <>
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
                        {(() => {
                          // console.log({ cell, context: cell.getContext() });
                          return flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          );
                        })()}
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
