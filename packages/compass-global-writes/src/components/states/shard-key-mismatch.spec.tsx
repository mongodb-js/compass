import React from 'react';
import { expect } from 'chai';
import { screen, userEvent } from '@mongodb-js/testing-library-compass';
import {
  ShardKeyMismatch,
  type ShardKeyMismatchProps,
} from './shard-key-mismatch';
import { renderWithStore } from '../../../tests/create-store';
import Sinon from 'sinon';

describe('ShardKeyMismatch', function () {
  const baseProps: ShardKeyMismatchProps = {
    namespace: 'db1.coll1',
    shardKey: {
      fields: [
        { type: 'RANGE', name: 'location' },
        { type: 'RANGE', name: 'secondary' },
      ],
      isUnique: false,
    },
    requestedShardKey: {
      fields: [
        { type: 'RANGE', name: 'location' },
        { type: 'RANGE', name: 'tertiary' },
      ],
      isUnique: true,
    },
    isUnmanagingNamespace: false,
    onUnmanageNamespace: () => {},
  };

  function renderWithProps(
    props?: Partial<ShardKeyMismatchProps>,
    options?: Parameters<typeof renderWithStore>[1]
  ) {
    return renderWithStore(
      <ShardKeyMismatch {...baseProps} {...props} />,
      options
    );
  }

  it('Describes next steps', async function () {
    await renderWithProps();

    expect(
      screen.findByText(
        /Please click the button below to unmanage this collection/
      )
    ).to.exist;
  });

  it('Describes the shardKey (with metadata)', async function () {
    await renderWithProps();

    const title = await screen.findByTestId(
      'existing-shardkey-description-title'
    );
    expect(title).to.be.visible;
    expect(title.textContent).to.equal(
      `${baseProps.namespace} is configured with the following shard key:`
    );
    const list = await screen.findByTestId(
      'existing-shardkey-description-content'
    );
    expect(list).to.be.visible;
    expect(list.textContent).to.contain(
      `"location" (range), "secondary" (range)`
    );
    expect(list.textContent).to.contain(`unique: false`);
  });

  it('Describes the requested shardKey (with metadata)', async function () {
    await renderWithProps();

    const title = await screen.findByTestId(
      'requested-shardkey-description-title'
    );
    expect(title).to.be.visible;
    expect(title.textContent).to.equal('You requested to use the shard key:');
    const list = await screen.findByTestId(
      'requested-shardkey-description-content'
    );
    expect(list).to.be.visible;
    expect(list.textContent).to.contain(
      `"location" (range), "tertiary" (range)`
    );
    expect(list.textContent).to.contain(`unique: true`);
  });

  it('Provides button to unmanage', async function () {
    const onUnmanageNamespace = Sinon.spy();
    await renderWithProps({ onUnmanageNamespace });

    const btn = await screen.findByRole<HTMLButtonElement>('button', {
      name: /Unmanage collection/,
    });
    expect(btn).to.be.visible;

    userEvent.click(btn);

    expect(onUnmanageNamespace).to.have.been.calledOnce;
  });

  it('Unmanage btn is disabled when the action is in progress', async function () {
    const onUnmanageNamespace = Sinon.spy();
    await renderWithProps({ onUnmanageNamespace, isUnmanagingNamespace: true });

    const btn = await screen.findByTestId<HTMLButtonElement>(
      'unmanage-collection-button'
    );
    expect(btn).to.be.visible;
    expect(btn.getAttribute('aria-disabled')).to.equal('true');

    userEvent.click(btn);

    expect(onUnmanageNamespace).not.to.have.been.called;
  });
});
