import React from 'react';
import { EventEmitter } from 'events';
import { expect } from 'chai';
import sinon from 'sinon';
import {
  render,
  screen,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { AtlasConnectionStatus } from './atlas-connection-status';
import { AtlasAuthServiceProvider } from '../provider';
import type { AtlasAuthService } from '../provider';
import type { AtlasUserInfo } from '../util';

/**
 * Minimal fake AtlasAuthService backed by a real EventEmitter so the
 * component's on/off/emit subscriptions behave like the real service.
 */
class FakeAtlasAuthService extends EventEmitter {
  private user: AtlasUserInfo | null;
  public signOut = sinon.stub().callsFake(() => {
    this.user = null;
    this.emit('signed-out');
    return Promise.resolve();
  });

  constructor(user: AtlasUserInfo | null) {
    super();
    this.user = user;
  }

  getUserInfo(): Promise<AtlasUserInfo> {
    if (!this.user) {
      return Promise.reject(new Error('not signed in'));
    }
    return Promise.resolve(this.user);
  }

  simulateSignIn(user: AtlasUserInfo) {
    this.user = user;
    this.emit('signed-in');
  }
}

describe('AtlasConnectionStatus', function () {
  function renderStatus(
    service: FakeAtlasAuthService,
    props: Partial<React.ComponentProps<typeof AtlasConnectionStatus>> = {}
  ) {
    return render(
      <AtlasAuthServiceProvider value={service as unknown as AtlasAuthService}>
        <AtlasConnectionStatus {...props} />
      </AtlasAuthServiceProvider>
    );
  }

  it('renders nothing when the user is not signed in', async function () {
    const service = new FakeAtlasAuthService(null);
    renderStatus(service);

    await waitFor(() => {
      expect(screen.queryByTestId('atlas-connection-status')).to.not.exist;
    });
  });

  it('renders the status and disconnect button when signed in', async function () {
    const service = new FakeAtlasAuthService({ sub: 'user-1' });
    renderStatus(service);

    await waitFor(() => {
      expect(screen.getByTestId('atlas-connection-status')).to.exist;
    });
    expect(screen.getByText('Signed in to Atlas')).to.exist;
    expect(screen.getByText('Disconnect Atlas')).to.exist;
  });

  it('calls signOut and hides itself when disconnect is clicked', async function () {
    const service = new FakeAtlasAuthService({ sub: 'user-1' });
    renderStatus(service);

    await waitFor(() => {
      expect(screen.getByTestId('atlas-connection-status')).to.exist;
    });

    userEvent.click(screen.getByTestId('atlas-connection-status-disconnect'));

    expect(service.signOut).to.have.been.calledOnce;
    await waitFor(() => {
      expect(screen.queryByTestId('atlas-connection-status')).to.not.exist;
    });
  });

  it('appears when the user signs in externally (signed-in event)', async function () {
    const service = new FakeAtlasAuthService(null);
    renderStatus(service);

    await waitFor(() => {
      expect(screen.queryByTestId('atlas-connection-status')).to.not.exist;
    });

    service.simulateSignIn({ sub: 'user-1' });

    await waitFor(() => {
      expect(screen.getByTestId('atlas-connection-status')).to.exist;
    });
  });

  it('disappears when the user signs out externally (signed-out event)', async function () {
    const service = new FakeAtlasAuthService({ sub: 'user-1' });
    renderStatus(service);

    await waitFor(() => {
      expect(screen.getByTestId('atlas-connection-status')).to.exist;
    });

    service.emit('signed-out');

    await waitFor(() => {
      expect(screen.queryByTestId('atlas-connection-status')).to.not.exist;
    });
  });
});
