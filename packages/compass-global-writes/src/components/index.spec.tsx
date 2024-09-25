import React from 'react';
import { expect } from 'chai';
import { screen } from '@mongodb-js/testing-library-compass';
import { GlobalWrites } from './index';
import { renderWithStore } from './../../tests/create-store';

describe('Compass GlobalWrites Plugin', function () {
  it('renders plugin in NOT_READY state', function () {
    renderWithStore(<GlobalWrites shardingStatus={'NOT_READY'} />);
    expect(screen.getByText('Loading ...')).to.exist;
  });

  it('renders plugin in UNSHARDED state', function () {
    renderWithStore(<GlobalWrites shardingStatus={'UNSHARDED'} />);
    expect(screen.getByTestId('shard-collection-button')).to.exist;
  });
});
