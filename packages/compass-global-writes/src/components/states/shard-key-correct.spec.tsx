import React from 'react';
import { expect } from 'chai';
import { screen, userEvent } from '@mongodb-js/testing-library-compass';
import {
  ShardKeyCorrect,
  type ShardKeyCorrectProps,
} from './shard-key-correct';
import { type ShardZoneData } from '../../store/reducer';
import Sinon from 'sinon';
import { renderWithStore } from '../../../tests/create-store';

describe('ShardKeyCorrect', function () {
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
  ];

  const baseProps: ShardKeyCorrectProps = {
    shardZones,
    namespace: 'db1.coll1',
    shardKey: {
      fields: [
        { type: 'RANGE', name: 'location' },
        { type: 'HASHED', name: 'secondary' },
      ],
      isUnique: false,
    },
    isUnmanagingNamespace: false,
    onUnmanageNamespace: () => {},
  };

  function renderWithProps(
    props?: Partial<ShardKeyCorrectProps>,
    options?: Parameters<typeof renderWithStore>[1]
  ) {
    return renderWithStore(
      <ShardKeyCorrect {...baseProps} {...props} />,
      options
    );
  }

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

  it('Describes the shardKey', async function () {
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
    expect(list.textContent).to.contain(`"location", "secondary"`);
  });

  it('Includes code examples', async function () {
    await renderWithProps();

    const example = await screen.findByText(/Example commands/);
    expect(example).to.be.visible;
  });
});
