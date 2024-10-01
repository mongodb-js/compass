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
    // TODO(COMPASS-8336):
    // Add search
    // group zones by ShardZoneData.typeOneIsoCode
    // and display them in a single row that can be expanded
    <Table className={containerStyles} title="Zone Mapping">
      <TableHead isSticky>
        <HeaderRow>
          <HeaderCell>Location Name</HeaderCell>
          <HeaderCell>Zone</HeaderCell>
        </HeaderRow>
      </TableHead>
      <TableBody>
        {shardZones.map(
          ({ readableName, zoneName, zoneLocations, isoCode }, index) => {
            return (
              <Row key={index}>
                <Cell>
                  {readableName} ({isoCode})
                </Cell>
                <Cell>
                  {zoneName} ({zoneLocations.join(', ')})
                </Cell>
              </Row>
            );
          }
        )}
      </TableBody>
    </Table>
  );
}
