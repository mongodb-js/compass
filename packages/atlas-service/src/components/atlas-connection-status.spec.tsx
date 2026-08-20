import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import {
  createPluginTestHelpers,
  screen,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { AtlasConnectionStatus } from './atlas-connection-status';
import type { AtlasAuthService, AtlasUserInfo } from '../provider';
import AtlasAuthPlugin from '../renderer';

class FakeAtlasAuthService {
  private user: AtlasUserInfo | null;
  public signOut = sinon.stub().callsFake(() => {
    this.user = null;
    return Promise.resolve();
  });

  constructor(user: AtlasUserInfo | null) {
    this.user = user;
  }

  isAuthenticated(): Promise<boolean> {
    return Promise.resolve(!!this.user);
  }

  getUserInfo(): Promise<AtlasUserInfo> {
    if (!this.user) {
      return Promise.reject(new Error('not signed in'));
    }
    return Promise.resolve(this.user);
  }

  simulateSignIn(user: AtlasUserInfo) {
    this.user = user;
  }
}

describe('AtlasConnectionStatus', function () {
  function renderStatus(service: FakeAtlasAuthService) {
    const { renderWithConnections } = createPluginTestHelpers(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      AtlasAuthPlugin.withMockServices({
        atlasAuthService: service as unknown as AtlasAuthService,
      })
    );
    return renderWithConnections(<AtlasConnectionStatus />);
  }

  it('renders nothing when the user is not signed in', async function () {
    renderStatus(new FakeAtlasAuthService(null));

    await waitFor(() => {
      expect(screen.queryByTestId('atlas-connection-status')).to.not.exist;
    });
  });

  it('renders the status and disconnect button when signed in', async function () {
    renderStatus(new FakeAtlasAuthService({ sub: 'user-1' }));

    await waitFor(() => {
      expect(screen.getByTestId('atlas-connection-status')).to.exist;
    });
    expect(screen.getByText('Signed in to Atlas')).to.exist;
    expect(screen.getByText('Disconnect Atlas')).to.exist;
  });

  it('confirms, calls signOut, and hides itself when disconnect is confirmed', async function () {
    const service = new FakeAtlasAuthService({ sub: 'user-1' });
    renderStatus(service);

    await waitFor(() => {
      expect(screen.getByTestId('atlas-connection-status')).to.exist;
    });

    userEvent.click(screen.getByTestId('atlas-connection-status-disconnect'));

    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to disconnect Atlas?')).to
        .exist;
    });
    expect(service.signOut).to.not.have.been.called;

    userEvent.click(screen.getByRole('button', { name: 'Disconnect' }));

    await waitFor(() => {
      expect(service.signOut).to.have.been.calledOnce;
    });
    await waitFor(() => {
      expect(screen.queryByTestId('atlas-connection-status')).to.not.exist;
    });
    await waitFor(() => {
      expect(screen.getByText('Disconnected from Atlas')).to.exist;
    });
  });

  it('does not sign out when the disconnect confirmation is cancelled', async function () {
    const service = new FakeAtlasAuthService({ sub: 'user-1' });
    renderStatus(service);

    await waitFor(() => {
      expect(screen.getByTestId('atlas-connection-status')).to.exist;
    });

    userEvent.click(screen.getByTestId('atlas-connection-status-disconnect'));

    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to disconnect Atlas?')).to
        .exist;
    });

    userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(service.signOut).to.not.have.been.called;
    expect(screen.getByTestId('atlas-connection-status')).to.exist;
  });
});
