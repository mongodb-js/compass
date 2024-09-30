import React from 'react';
import {
  Table,
  TableBody,
  TableHead,
  HeaderRow,
  HeaderCell,
  Row,
  Cell,
  css,
} from '@mongodb-js/compass-components';
import type { ShardZoneData } from '../store/reducer';

const containerStyles = css({
  maxWidth: '700px',
  height: '400px',
});

export function ShardZonesTable({
  shardZones,
}: {
  shardZones: ShardZoneData[];
}) {
  return (
    // TODO: Add option to search and group zones by ShardZoneData.typeOneIsoCode
    // and display them in nested row
    <Table className={containerStyles} title="Zone Mapping">
      <TableHead isSticky>
        <HeaderRow>
          <HeaderCell>Location Name</HeaderCell>
          <HeaderCell>Zone</HeaderCell>
        </HeaderRow>
      </TableHead>
      <TableBody>
        {shardZones.map((shardZone, index) => {
          return (
            <Row key={index}>
              <Cell>{shardZone.country}</Cell>
              <Cell>
                {shardZone.zoneName}({shardZone.zoneLocations.join(', ')})
              </Cell>
            </Row>
          );
        })}
      </TableBody>
    </Table>
  );
}
