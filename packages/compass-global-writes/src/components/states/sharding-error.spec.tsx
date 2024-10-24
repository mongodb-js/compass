import React from 'react';
import { expect } from 'chai';
import { screen, userEvent } from '@mongodb-js/testing-library-compass';
import { ShardingError } from './sharding-error';
import { renderWithStore } from '../../../tests/create-store';
import Sinon from 'sinon';

const shardingError = 'This is an error';
function renderWithProps(
  props?: Partial<React.ComponentProps<typeof ShardingError>>
) {
  return renderWithStore(
    <ShardingError
      isSubmittingForSharding={false}
      isCancellingSharding={false}
      shardingError={shardingError}
      onCancelSharding={() => {}}
      {...props}
    />
  );
}

describe('ShardingError', function () {
  it('renders the error', async function () {
    await renderWithProps();
    expect(screen.getByText(/There was an error sharding your collection/)).to
      .be.visible;
    expect(screen.getByText(shardingError)).to.be.visible;
  });

  it('includes a button to cancel sharding', async function () {
    const onCancelSharding = Sinon.spy();
    await renderWithProps({ onCancelSharding });
    const btn = screen.getByRole('button', { name: 'Cancel Request' });
    expect(btn).to.be.visible;

    userEvent.click(btn);
    expect(onCancelSharding).to.have.been.called;
  });

  it('the cancel sharding button is disabled when cancelling is in progress', async function () {
    const onCancelSharding = Sinon.spy();
    await renderWithProps({ onCancelSharding, isCancellingSharding: true });
    const btn = screen.getByTestId('cancel-sharding-btn');

    userEvent.click(btn);
    expect(onCancelSharding).not.to.have.been.called;
  });

  it('the cancel sharding button is disabled also when sharding is in progress', async function () {
    const onCancelSharding = Sinon.spy();
    await renderWithProps({ onCancelSharding, isSubmittingForSharding: true });
    const btn = screen.getByTestId('cancel-sharding-btn');

    userEvent.click(btn);
    expect(onCancelSharding).not.to.have.been.called;
  });

  it('includes the createShardKeyForm', async function () {
    await renderWithProps();
    expect(screen.getByRole('button', { name: 'Shard Collection' })).to.be
      .visible;
  });
});
