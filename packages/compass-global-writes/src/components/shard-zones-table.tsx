import React, { useMemo, useRef } from 'react';
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
} from '@mongodb-js/compass-components';
import type { ShardZoneData } from '../store/reducer';

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

export function ShardZonesTable({
  shardZones,
}: {
  shardZones: ShardZoneData[];
}) {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const data = useMemo<ShardZoneExpandableRow[]>(() => {
    const grouppedZones = shardZones.reduce<
      Record<ShardZoneData['typeOneIsoCode'], ShardZoneExpandableRow>
    >((groups, next) => {
      const { typeOneIsoCode, isoCode } = next;
      if (!groups[typeOneIsoCode]) {
        groups[typeOneIsoCode] = { ...parseRow(next), subRows: [] };
      }
      if (typeOneIsoCode === isoCode) {
        Object.assign(groups[typeOneIsoCode], next);
      } else {
        groups[typeOneIsoCode].subRows.push(parseRow(next));
      }
      return groups;
    }, {});
    return Object.values(grouppedZones);
  }, [shardZones]);

  const table = useLeafyGreenTable({
    containerRef: tableContainerRef,
    data,
    columns,
  });

  const { rows } = table.getRowModel();

  return (
    // TODO(COMPASS-8336):
    // Add search
    // group zones by ShardZoneData.typeOneIsoCode
    // and display them in a single row that can be expanded

    <Table
      className={containerStyles}
      title="Zone Mapping"
      table={table}
      ref={tableContainerRef}
    >
      <colgroup>
        <col width="300"></col>
        <col />
      </colgroup>
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
  );
}
