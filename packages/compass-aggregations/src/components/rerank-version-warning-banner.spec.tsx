import React from 'react';
import {
  screen,
  renderWithActiveConnection,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
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
      nonAtlasConnectionInfo,
      { preferences: { enableRerank: true } }
    );
    expect(screen.getByTestId('rerank-version-warning')).to.exist;
    expect(screen.getByText(/Upgrade your cluster/)).to.exist;
  });

  it('shows Atlas upgrade link when atlasMetadata is present', async function () {
    await renderWithActiveConnection(
      <RerankVersionWarningBanner data-testid="rerank-version-warning" />,
      atlasConnectionInfo,
      { preferences: { enableRerank: true } }
    );
    const link = screen.getByRole('link', { name: /Upgrade Cluster/i });
    expect(link)
      .to.have.attribute('href')
      .that.includes('/clusters/edit/myCluster');
  });

  it('shows docs link when atlasMetadata is not present', async function () {
    await renderWithActiveConnection(
      <RerankVersionWarningBanner data-testid="rerank-version-warning" />,
      nonAtlasConnectionInfo,
      { preferences: { enableRerank: true } }
    );
    const link = screen.getByRole('link', { name: /Upgrade Cluster/i });
    expect(link).to.have.attribute(
      'href',
      'https://www.mongodb.com/docs/atlas/tutorial/major-version-change/'
    );
  });
});
