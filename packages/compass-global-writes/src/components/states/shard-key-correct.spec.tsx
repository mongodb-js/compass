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
import { type ConnectionInfo } from '@mongodb-js/compass-connections/provider';

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
  ];

  const baseProps: ShardKeyCorrectProps = {
    shardZones,
    namespace: 'db1.coll1',
    shardKey: {
      fields: [
        { type: 'HASHED', name: 'location' },
        { type: 'RANGE', name: 'secondary' },
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
      'shard-collection-button'
    );
    expect(btn).to.be.visible;
    expect(btn.getAttribute('aria-disabled')).to.equal('true');

    userEvent.click(btn);

    expect(onUnmanageNamespace).not.to.have.been.called;
  });

  it('Provides link to Edit Configuration', async function () {
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
    await renderWithProps(undefined, {
      connectionInfo,
    });

    const link = await screen.findByRole('link', {
      name: /Edit Configuration/,
    });
    const expectedHref = `/v2/${connectionInfo.atlasMetadata?.projectId}#/clusters/edit/${connectionInfo.atlasMetadata?.clusterName}`;

    expect(link).to.be.visible;
    expect(link).to.have.attribute('href', expectedHref);
  });

  it('Describes the shardKey', async function () {
    await renderWithProps();

    const title = await screen.findByTestId('shardkey-description-title');
    expect(title).to.be.visible;
    expect(title.textContent).to.equal(
      `${baseProps.namespace} is configured with the following shard key:`
    );
    const list = await screen.findByTestId('shardkey-description-content');
    expect(list).to.be.visible;
    expect(list.textContent).to.contain(`"location", "secondary"`);
  });

  it('Contains sample codes', async function () {
    await renderWithProps();

    const findingDocumentsSample = await screen.findByTestId(
      'sample-finding-documents'
    );
    expect(findingDocumentsSample).to.be.visible;
    expect(findingDocumentsSample.textContent).to.contain(
      `use db1db["coll1"].find({"location": "US-NY", "secondary": "<id_value>"})`
    );

    const insertingDocumentsSample = await screen.findByTestId(
      'sample-inserting-documents'
    );
    expect(insertingDocumentsSample).to.be.visible;
    expect(insertingDocumentsSample.textContent).to.contain(
      `use db1db["coll1"].insertOne({"location": "US-NY", "secondary": "<id_value>",...<other fields>})`
    );
  });
});
