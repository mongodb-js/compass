import React from 'react';
import { expect } from 'chai';
import {
  render,
  screen,
  userEvent,
  within,
} from '@mongodb-js/testing-library-compass';
import { ShardZonesTable } from './shard-zones-table';
import { type ShardZoneData } from '../store/reducer';

describe('Compass GlobalWrites Plugin', function () {
  const shardZones: ShardZoneData[] = [
    {
      zoneId: '45893084',
      country: 'Germany',
      readableName: 'Germany',
      isoCode: 'DE',
      typeOneIsoCode: 'DE',
      zoneName: 'EMEA',
      zoneLocations: ['Frankfurt'],
    },
    {
      zoneId: '43829408',
      country: 'Germany',
      readableName: 'Germany - Berlin',
      isoCode: 'DE-BE',
      typeOneIsoCode: 'DE',
      zoneName: 'EMEA',
      zoneLocations: ['Frankfurt'],
    },
  ];

  it('renders the Location name & Zone for top level zones', function () {
    render(<ShardZonesTable shardZones={shardZones} />);

    const rows = screen.getAllByRole('row');
    expect(rows).to.have.lengthOf(2); // 1 header, 1 item
    expect(within(rows[1]).getByText('Germany (DE)')).to.be.visible;
    expect(within(rows[1]).getByText('EMEA (Frankfurt)')).to.be.visible;
  });

  it('subrows can be expanded', function () {
    render(<ShardZonesTable shardZones={shardZones} />);

    const expandBtn = screen.getByRole('button', { name: 'Expand row' });
    expect(expandBtn).to.be.visible;

    userEvent.click(expandBtn);

    const rows = screen.getAllByRole('row');
    expect(rows).to.have.lengthOf(3); // 1 header, 2 items
    expect(within(rows[1]).getByText('Germany (DE)')).to.be.visible;
    expect(within(rows[1]).getByText('EMEA (Frankfurt)')).to.be.visible;
    expect(within(rows[2]).getByText('Germany - Berlin (DE-BE)')).to.be.visible;
    expect(within(rows[2]).getByText('EMEA (Frankfurt)')).to.be.visible;
  });

  describe('search', function () {
    before(function () {
      if (
        process.env.NODE_ENV === 'test' &&
        process.env.npm_lifecycle_event === 'test-electron'
      ) {
        // TODO(COMPASS-8368)
        this.skip();
      }
    });
    it('allows top level search', function () {
      render(
        <ShardZonesTable
          shardZones={[
            ...shardZones,
            {
              zoneId: '438908',
              country: 'Slovakia',
              readableName: 'Slovakia',
              isoCode: 'SK',
              typeOneIsoCode: 'SK',
              zoneName: 'Zone 2',
              zoneLocations: ['Location 2'],
            },
          ]}
        />
      );

      const searchInput = screen.getByLabelText('Search for a location');
      expect(searchInput).to.be.visible;
      userEvent.type(searchInput, 'Slo');
      const rows = screen.getAllByRole('row');
      // screen.debug(rows[1]);
      expect(rows).to.have.lengthOf(2); // 1 header, 1 item
      expect(within(rows[1]).getByText('Slovakia (SK)')).to.be.visible;
      expect(within(rows[1]).getByText('Zone 2 (Location 2)')).to.be.visible;
    });

    it('allows subZone search', function () {
      render(
        <ShardZonesTable
          shardZones={[
            ...shardZones,
            {
              zoneId: '4389048',
              country: 'Slovakia',
              readableName: 'Slovakia',
              isoCode: 'SK',
              typeOneIsoCode: 'SK',
              zoneName: 'Zone 2',
              zoneLocations: ['Location 2'],
            },
            {
              zoneId: '8908900',
              country: 'Slovakia',
              readableName: 'Slovakia - Bratislava',
              isoCode: 'SK-BA',
              typeOneIsoCode: 'SK',
              zoneName: 'Zone 2',
              zoneLocations: ['Location 2'],
            },
          ]}
        />
      );

      const searchInput = screen.getByLabelText('Search for a location');
      expect(searchInput).to.be.visible;
      userEvent.type(searchInput, 'Bra');
      const rows = screen.getAllByRole('row');
      expect(rows).to.have.lengthOf(3); // 1 header, 2 items
      expect(within(rows[1]).getByText('Slovakia (SK)')).to.be.visible;
      expect(within(rows[1]).getByText('Zone 2 (Location 2)')).to.be.visible;
      expect(within(rows[2]).getByText('Slovakia - Bratislava (SK-BA)')).to.be
        .visible;
      expect(within(rows[2]).getByText('Zone 2 (Location 2)')).to.be.visible;
    });
  });
});
