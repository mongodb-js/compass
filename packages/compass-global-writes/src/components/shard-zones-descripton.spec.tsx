import React from 'react';
import { expect } from 'chai';
import { screen } from '@mongodb-js/testing-library-compass';
import type { ConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { renderWithStore } from '../../tests/create-store';
import { ShardZonesDescription } from './shard-zones-description';

describe('ShardZonesDescription', () => {
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
    await renderWithStore(<ShardZonesDescription />, {
      connectionInfo,
    });

    const link = await screen.findByRole('link', {
      name: /Edit Configuration/,
    });
    const expectedHref = `/v2/${connectionInfo.atlasMetadata?.projectId}#/clusters/edit/${connectionInfo.atlasMetadata?.clusterName}`;

    expect(link).to.be.visible;
    expect(link).to.have.attribute('href', expectedHref);
  });
});
