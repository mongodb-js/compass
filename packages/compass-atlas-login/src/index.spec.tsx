import React from 'react';
import { EventEmitter } from 'events';
import { expect } from 'chai';
import sinon from 'sinon';
import {
  createPluginTestHelpers,
  screen,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import type {
  AtlasAuthService,
  AtlasUserInfo,
} from '@mongodb-js/atlas-service/provider';
import { AtlasAuthPlugin } from '@mongodb-js/atlas-service/renderer';
import { AtlasConnectionStatus } from './index';

class FakeAtlasAuthService extends EventEmitter {
  private user: AtlasUserInfo | null;

  constructor(user: AtlasUserInfo | null = null) {
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

  simulateSignOut() {
    this.user = null;
    this.emit('signed-out');
  }
}

describe('CompassAtlasLoginPlugin', function () {
  function renderPlugin(atlasAuthService: FakeAtlasAuthService) {
    const { renderWithConnections } = createPluginTestHelpers(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      AtlasAuthPlugin.withMockServices({
        atlasAuthService: atlasAuthService as unknown as AtlasAuthService,
      })
    );
    return renderWithConnections(<AtlasConnectionStatus />);
  }

  afterEach(function () {
    sinon.restore();
  });

  it('loads the current signed-in user into the store on activation', async function () {
    const { plugin } = renderPlugin(
      new FakeAtlasAuthService({ sub: 'user-1' })
    );

    await waitFor(() => {
      expect(plugin.store.getState().userInfo).to.deep.equal({ sub: 'user-1' });
    });
  });

  it('leaves the user null on activation when there is no session', async function () {
    const { plugin } = renderPlugin(new FakeAtlasAuthService(null));

    await waitFor(() => {
      expect(screen.queryByTestId('atlas-connection-status')).to.not.exist;
    });
    expect(plugin.store.getState().userInfo).to.equal(null);
  });

  it('syncs the store when the auth service reports a sign-in', async function () {
    const atlasAuthService = new FakeAtlasAuthService(null);
    const { plugin } = renderPlugin(atlasAuthService);

    await waitFor(() => {
      expect(plugin.store.getState().userInfo).to.equal(null);
    });

    atlasAuthService.simulateSignIn({ sub: 'user-1' });

    await waitFor(() => {
      expect(plugin.store.getState().userInfo).to.deep.equal({ sub: 'user-1' });
    });
    expect(screen.getByTestId('atlas-connection-status')).to.exist;
  });

  it('syncs the store when the auth service reports a sign-out', async function () {
    const atlasAuthService = new FakeAtlasAuthService({ sub: 'user-1' });
    const { plugin } = renderPlugin(atlasAuthService);

    await waitFor(() => {
      expect(plugin.store.getState().userInfo).to.deep.equal({ sub: 'user-1' });
    });

    atlasAuthService.simulateSignOut();

    await waitFor(() => {
      expect(plugin.store.getState().userInfo).to.equal(null);
    });
    expect(screen.queryByTestId('atlas-connection-status')).to.not.exist;
  });

  it('stops syncing auth events after the plugin is unmounted', async function () {
    const atlasAuthService = new FakeAtlasAuthService(null);
    const { plugin, unmount } = renderPlugin(atlasAuthService);

    await waitFor(() => {
      expect(plugin.store.getState().userInfo).to.equal(null);
    });

    unmount();
    expect(atlasAuthService.listenerCount('signed-in')).to.equal(0);
    expect(atlasAuthService.listenerCount('signed-out')).to.equal(0);

    atlasAuthService.simulateSignIn({ sub: 'user-1' });

    expect(plugin.store.getState().userInfo).to.equal(null);
  });
});
