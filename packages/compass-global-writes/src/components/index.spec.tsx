import React from 'react';
import { expect } from 'chai';
import { screen } from '@mongodb-js/testing-library-compass';
import { GlobalWrites } from './index';
import { renderWithStore } from './../../tests/create-store';

describe('Compass GlobalWrites Plugin', function () {
  it('renders plugin in NOT_READY state', function () {
    renderWithStore(<GlobalWrites shardingStatus={'NOT_READY'} />);
    expect(screen.getByText(/loading/i)).to.exist;
  });

  it('renders plugin in UNSHARDED state', function () {
    renderWithStore(<GlobalWrites shardingStatus={'UNSHARDED'} />);
    expect(screen.getByTestId('shard-collection-button')).to.exist;
  });

  it('renders plugin in SHARDING state', function () {
    renderWithStore(<GlobalWrites shardingStatus={'SHARDING'} />);
    expect(screen.getByText(/sharding your collection/i)).to.exist;
  });
});
