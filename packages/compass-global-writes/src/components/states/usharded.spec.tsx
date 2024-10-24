import React from 'react';
import { expect } from 'chai';
import { screen } from '@mongodb-js/testing-library-compass';
import { UnshardedState } from './unsharded';
import { renderWithStore } from '../../../tests/create-store';

function renderWithProps(
  props?: Partial<React.ComponentProps<typeof UnshardedState>>
) {
  return renderWithStore(<UnshardedState {...props} />);
}

describe('UnshardedState', function () {
  it('renders the warning banner', async function () {
    await renderWithProps();
    expect(screen.getByRole('alert')).to.exist;
  });

  it('renders the text to the user', async function () {
    await renderWithProps();
    expect(screen.getByTestId('unsharded-text-description')).to.exist;
  });

  it('includes the createShardKeyForm', async function () {
    await renderWithProps();
    expect(screen.getByRole('button', { name: 'Shard Collection' })).to.be
      .visible;
  });
});
