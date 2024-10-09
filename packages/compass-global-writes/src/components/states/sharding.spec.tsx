import React from 'react';
import { expect } from 'chai';
import { screen } from '@mongodb-js/testing-library-compass';
import { ShardingState } from './sharding';
import { renderWithStore } from '../../../tests/create-store';

function renderWithProps(
  props?: Partial<React.ComponentProps<typeof ShardingState>>
) {
  return renderWithStore(<ShardingState {...props} />);
}

describe('Sharding', function () {
  it('renders the info banner', async function () {
    await renderWithProps();
    expect(screen.getByRole('alert')).to.exist;
  });
});
