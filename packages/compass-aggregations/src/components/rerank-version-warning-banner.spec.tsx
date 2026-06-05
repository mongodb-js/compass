import React from 'react';
import {
  screen,
  userEvent,
  renderWithActiveConnection,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
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
  let windowOpenStub: sinon.SinonStub;

  beforeEach(function () {
    windowOpenStub = sinon.stub(window, 'open');
  });

  afterEach(function () {
    windowOpenStub.restore();
  });

  it('renders the version warning message', async function () {
    await renderWithActiveConnection(
      <RerankVersionWarningBanner data-testid="rerank-version-warning" />,
      nonAtlasConnectionInfo
    );
    expect(screen.getByTestId('rerank-version-warning')).to.exist;
    expect(screen.getByText(/Upgrade your cluster/)).to.exist;
  });

  it('opens the Atlas upgrade page when atlasMetadata is present', async function () {
    await renderWithActiveConnection(
      <RerankVersionWarningBanner data-testid="rerank-version-warning" />,
      atlasConnectionInfo
    );
    const button = await screen.findByRole('button', {
      name: /Upgrade Cluster/i,
    });
    userEvent.click(button);
    expect(windowOpenStub).to.have.been.calledOnce;
    expect(windowOpenStub.firstCall.args[0]).to.include(
      '/clusters/edit/myCluster'
    );
  });

  it('opens the docs page when atlasMetadata is not present', async function () {
    await renderWithActiveConnection(
      <RerankVersionWarningBanner data-testid="rerank-version-warning" />,
      nonAtlasConnectionInfo
    );
    const button = await screen.findByRole('button', {
      name: /Upgrade Cluster/i,
    });
    userEvent.click(button);
    expect(windowOpenStub).to.have.been.calledOnceWith(
      'https://www.mongodb.com/docs/atlas/tutorial/major-version-change/'
    );
  });
});
