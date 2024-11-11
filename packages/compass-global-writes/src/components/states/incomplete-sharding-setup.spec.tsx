import React from 'react';
import { expect } from 'chai';
import { screen, userEvent } from '@mongodb-js/testing-library-compass';
import {
  IncompleteShardingSetup,
  type IncompleteShardingSetupProps,
} from './incomplete-sharding-setup';
import Sinon from 'sinon';
import { renderWithStore } from '../../../tests/create-store';
import { type ConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { type ShardZoneData } from '../../store/reducer';

describe('IncompleteShardingSetup', function () {
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
  const baseProps: IncompleteShardingSetupProps = {
    namespace: 'db1.coll1',
    shardZones,
    shardKey: {
      fields: [
        { type: 'RANGE', name: 'location' },
        { type: 'HASHED', name: 'secondary' },
      ],
      isUnique: false,
    },
    isSubmittingForSharding: false,
    onResume: () => {},
  };

  const connectionInfo = {
    id: 'testConnection',
    connectionOptions: {
      connectionString: 'mongodb://test',
    },
    atlasMetadata: {
      projectId: 'project1',
      clusterName: 'myCluster',
    } as ConnectionInfo['atlasMetadata'],
  };

  function renderWithProps(
    props?: Partial<IncompleteShardingSetupProps>,
    options?: Parameters<typeof renderWithStore>[1]
  ) {
    return renderWithStore(
      <IncompleteShardingSetup {...baseProps} {...props} />,
      {
        connectionInfo,
        ...options,
      }
    );
  }

  it('Shows description', async function () {
    await renderWithProps();

    expect(screen.findByText(/your configuration is incomplete/)).to.be.exist;
    expect(screen.findByText(/Please enable Global Writes/)).to.be.exist;
  });

  it('Provides button to resume managed namespace', async function () {
    const onResume = Sinon.spy();
    await renderWithProps({ onResume });

    const btn = await screen.findByRole<HTMLButtonElement>('button', {
      name: /Enable Global Writes/,
    });
    expect(btn).to.be.visible;

    userEvent.click(btn);

    expect(onResume).to.have.been.calledOnce;
  });

  it('Manage btn is disabled when the action is in progress', async function () {
    const onResume = Sinon.spy();
    await renderWithProps({ onResume, isSubmittingForSharding: true });

    const btn = await screen.findByTestId<HTMLButtonElement>(
      'manage-collection-button'
    );
    expect(btn).to.be.visible;
    expect(btn.getAttribute('aria-disabled')).to.equal('true');

    userEvent.click(btn);

    expect(onResume).not.to.have.been.called;
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
