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
import type {
  AtlasAuthService,
  AtlasUserInfo,
} from '@mongodb-js/atlas-service/provider';
import { AtlasDebugFooter } from './atlas-debug-footer';

/**
 * Minimal fake AtlasAuthService backed by a real EventEmitter so the footer's
 * on/off/emit subscriptions behave like the real service.
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

  // Simulate an external sign-in (e.g. via the assistant flow).
  simulateSignIn(user: AtlasUserInfo) {
    this.user = user;
    this.emit('signed-in');
  }
}

describe('AtlasDebugFooter', function () {
  function renderFooter(service: FakeAtlasAuthService) {
    return render(
      <AtlasDebugFooter
        getAtlasAuthService={() => service as unknown as AtlasAuthService}
      />
    );
  }

  it('renders nothing when the user is not signed in', async function () {
    const service = new FakeAtlasAuthService(null);
    renderFooter(service);

    // getUserInfo rejects -> userInfo stays null -> footer hidden.
    await waitFor(() => {
      expect(screen.queryByTestId('atlas-debug-footer')).to.not.exist;
    });
  });

  it('renders the disconnect button when the user is signed in', async function () {
    const service = new FakeAtlasAuthService({ sub: 'user-1' });
    renderFooter(service);

    await waitFor(() => {
      expect(screen.getByTestId('atlas-debug-footer')).to.exist;
    });
    expect(screen.getByText('Signed in to Atlas')).to.exist;
    expect(screen.getByText('Disconnect Atlas for debugging')).to.exist;
  });

  it('calls signOut and hides itself when disconnect is clicked', async function () {
    const service = new FakeAtlasAuthService({ sub: 'user-1' });
    renderFooter(service);

    await waitFor(() => {
      expect(screen.getByTestId('atlas-debug-footer')).to.exist;
    });

    userEvent.click(screen.getByTestId('atlas-debug-footer-disconnect'));

    expect(service.signOut).to.have.been.calledOnce;
    await waitFor(() => {
      expect(screen.queryByTestId('atlas-debug-footer')).to.not.exist;
    });
  });

  it('appears when the user signs in externally (signed-in event)', async function () {
    const service = new FakeAtlasAuthService(null);
    renderFooter(service);

    await waitFor(() => {
      expect(screen.queryByTestId('atlas-debug-footer')).to.not.exist;
    });

    service.simulateSignIn({ sub: 'user-1' });

    await waitFor(() => {
      expect(screen.getByTestId('atlas-debug-footer')).to.exist;
    });
  });

  it('disappears when a signed-out event is generated', async function () {
    const service = new FakeAtlasAuthService({ sub: 'user-1' });
    renderFooter(service);

    await waitFor(() => {
      expect(screen.getByTestId('atlas-debug-footer')).to.exist;
    });

    service.emit('signed-out');

    await waitFor(() => {
      expect(screen.queryByTestId('atlas-debug-footer')).to.not.exist;
    });
  });
});
