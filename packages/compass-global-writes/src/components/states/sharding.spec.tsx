import React from 'react';
import { expect } from 'chai';
import { screen, userEvent } from '@mongodb-js/testing-library-compass';
import { ShardingState } from './sharding';
import { renderWithStore } from '../../../tests/create-store';
import Sinon from 'sinon';

function renderWithProps(
  props?: Partial<React.ComponentProps<typeof ShardingState>>
) {
  return renderWithStore(
    <ShardingState
      onCancelSharding={() => {}}
      isCancellingSharding={false}
      {...props}
    />
  );
}

describe('Sharding', function () {
  it('renders the info banner', async function () {
    await renderWithProps();
    expect(screen.getByRole('alert')).to.exist;
  });

  it('sharding request can be cancelled', async function () {
    const onCancelSharding = Sinon.spy();
    await renderWithProps({
      onCancelSharding,
    });
    const btn = screen.getByRole('button', { name: 'Cancel Request' });
    expect(btn).to.be.visible;

    userEvent.click(btn);

    expect(onCancelSharding).to.have.been.calledOnce;
  });

  it('when cancelling is in progress, it cannot be triggered again', async function () {
    const onCancelSharding = Sinon.spy();
    await renderWithProps({
      isCancellingSharding: true,
      onCancelSharding,
    });
    const btn = screen.getByTestId('cancel-sharding-btn');
    expect(btn.getAttribute('aria-disabled')).to.equal('true');

    userEvent.click(btn);

    expect(onCancelSharding).not.to.have.been.calledOnce;
  });
});
