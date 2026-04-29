import React from 'react';
import {
  screen,
  renderWithActiveConnection,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import type { ConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { RerankVersionWarningBanner } from './rerank-version-warning-banner';

const atlasConnectionInfo: ConnectionInfo = {
  id: 'test-atlas',
  connectionOptions: { connectionString: 'mongodb://test' },
  atlasMetadata: {
    projectId: 'project1',
    clusterName: 'myCluster',
  } as ConnectionInfo['atlasMetadata'],
};

const nonAtlasConnectionInfo: ConnectionInfo = {
  id: 'test',
  connectionOptions: { connectionString: 'mongodb://test' },
};

describe('RerankVersionWarningBanner', function () {
  it('renders the version warning message', async function () {
    await renderWithActiveConnection(
      <RerankVersionWarningBanner data-testid="rerank-version-warning" />,
      nonAtlasConnectionInfo
    );
    expect(screen.getByTestId('rerank-version-warning')).to.exist;
    expect(screen.getByText(/Upgrade your cluster/)).to.exist;
  });

  it('shows Atlas upgrade link when atlasMetadata is present', async function () {
    await renderWithActiveConnection(
      <RerankVersionWarningBanner data-testid="rerank-version-warning" />,
      atlasConnectionInfo
    );
    const link = await screen.findByRole('link', { name: /Upgrade Cluster/i });
    expect(link).to.be.visible;
    expect(link)
      .to.have.attribute('href')
      .that.includes('/clusters/edit/myCluster');
  });

  it('shows docs link when atlasMetadata is not present', async function () {
    await renderWithActiveConnection(
      <RerankVersionWarningBanner data-testid="rerank-version-warning" />,
      nonAtlasConnectionInfo
    );
    const link = await screen.findByRole('link', { name: /Upgrade Cluster/i });
    expect(link).to.be.visible;
    expect(link).to.have.attribute(
      'href',
      'https://www.mongodb.com/docs/atlas/tutorial/major-version-change/'
    );
  });
});
