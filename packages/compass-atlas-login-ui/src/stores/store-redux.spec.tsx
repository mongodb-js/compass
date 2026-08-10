import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import { EventEmitter } from 'events';
import {
  createPluginTestHelpers,
  screen,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import type {
  AtlasAuthService,
  AtlasUserInfo,
} from '@mongodb-js/atlas-service/provider';
import { CompassAtlasLoginPlugin, AtlasConnectionStatus } from '../index';
import {
  refreshUserInfo,
  signIn,
  clearUserInfo,
  disconnect,
} from './store-redux';

/**
 * Minimal fake AtlasAuthService backed by a real EventEmitter so the plugin's
 * activate-time subscriptions behave like the real service.
 */
class FakeAtlasAuthService extends EventEmitter {
  private user: AtlasUserInfo | null;
  public signIn: sinon.SinonStub;
  public signOut: sinon.SinonStub;

  constructor(user: AtlasUserInfo | null = null) {
    super();
    this.user = user;
    this.signIn = sinon.stub().callsFake(() => {
      this.user = { sub: 'user-1' };
      return Promise.resolve(this.user);
    });
    this.signOut = sinon.stub().callsFake(() => {
      this.user = null;
      return Promise.resolve();
    });
  }

  getUserInfo(): Promise<AtlasUserInfo> {
    if (!this.user) {
      return Promise.reject(new Error('not signed in'));
    }
    return Promise.resolve(this.user);
  }
}

describe('AtlasLogin store', function () {
  function renderStore(user: AtlasUserInfo | null = null) {
    const atlasAuthService = new FakeAtlasAuthService(user);
    const { renderWithConnections } = createPluginTestHelpers(
      CompassAtlasLoginPlugin.withMockServices({
        atlasAuthService: atlasAuthService as unknown as AtlasAuthService,
      })
    );
    const result = renderWithConnections(<AtlasConnectionStatus />);
    return { atlasAuthService, store: result.plugin.store };
  }

  afterEach(function () {
    sinon.restore();
  });

  it('has a null user by default', function () {
    const { store } = renderStore();
    expect(store.getState()).to.deep.equal({ userInfo: null });
  });

  describe('#refreshUserInfo', function () {
    it('loads the signed-in user into the store', async function () {
      const { store } = renderStore({ sub: 'user-1' });

      await store.dispatch(refreshUserInfo());

      expect(store.getState().userInfo).to.deep.equal({ sub: 'user-1' });
    });

    it('sets the user to null when the auth service has no session', async function () {
      const { store, atlasAuthService } = renderStore({ sub: 'user-1' });
      await store.dispatch(refreshUserInfo());
      expect(store.getState().userInfo).to.deep.equal({ sub: 'user-1' });

      atlasAuthService.signOut();
      await store.dispatch(refreshUserInfo());

      expect(store.getState().userInfo).to.equal(null);
    });
  });

  describe('#clearUserInfo', function () {
    it('resets the user to null', async function () {
      const { store } = renderStore({ sub: 'user-1' });
      await store.dispatch(refreshUserInfo());
      expect(store.getState().userInfo).to.deep.equal({ sub: 'user-1' });

      store.dispatch(clearUserInfo());

      expect(store.getState().userInfo).to.equal(null);
    });
  });

  describe('#signIn', function () {
    it('signin should reflect in the state and render connected toast', async function () {
      const { store, atlasAuthService } = renderStore(null);

      const result = await store.dispatch(signIn());

      expect(result).to.equal(true);
      expect(atlasAuthService.signIn).to.have.been.calledOnceWith({
        mainProcessSignIn: true,
      });
      expect(store.getState().userInfo).to.deep.equal({ sub: 'user-1' });
      await waitFor(() => {
        expect(screen.getByText('Connected to Atlas')).to.exist;
      });
      expect(screen.getByText('You can start using context from Atlas.')).to
        .exist;
    });

    it('emits a signed-in event on a fresh sign-in', async function () {
      const { store, atlasAuthService } = renderStore(null);
      const onSignedIn = sinon.stub();
      atlasAuthService.on('signed-in', onSignedIn);

      await store.dispatch(signIn());

      expect(onSignedIn).to.have.been.called;
    });

    it('does not sign in again or render a toast when already signed in', async function () {
      const { store, atlasAuthService } = renderStore({ sub: 'existing-user' });

      const result = await store.dispatch(signIn());

      expect(result).to.equal(true);
      expect(atlasAuthService.signIn).to.not.have.been.called;
      expect(screen.queryByText('Connected to Atlas')).to.not.exist;
      expect(store.getState().userInfo).to.deep.equal({ sub: 'existing-user' });
    });

    it('resolves false and does not render a toast when sign-in fails', async function () {
      const { store, atlasAuthService } = renderStore(null);
      atlasAuthService.signIn.rejects(new Error('sign-in failed'));

      const result = await store.dispatch(signIn());

      expect(result).to.equal(false);
      expect(screen.queryByText('Connected to Atlas')).to.not.exist;
      expect(store.getState().userInfo).to.equal(null);
    });
  });

  describe('#disconnect', function () {
    it('clears the user and renders a toast', async function () {
      const { store, atlasAuthService } = renderStore({ sub: 'user-1' });
      await store.dispatch(refreshUserInfo());

      const disconnectPromise = store.dispatch(disconnect());

      // The confirmation modal should be shown to the user.
      await waitFor(() => {
        expect(screen.getByText('Are you sure you want to disconnect Atlas?'))
          .to.exist;
      });
      expect(atlasAuthService.signOut).to.not.have.been.called;

      userEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
      await disconnectPromise;

      expect(atlasAuthService.signOut).to.have.been.calledOnce;
      expect(store.getState().userInfo).to.equal(null);
      await waitFor(() => {
        expect(screen.getByText('Disconnected from Atlas')).to.exist;
      });
    });

    it('does nothing when the confirmation is cancelled', async function () {
      const { store, atlasAuthService } = renderStore({ sub: 'user-1' });
      await store.dispatch(refreshUserInfo());

      const disconnectPromise = store.dispatch(disconnect());

      await waitFor(() => {
        expect(screen.getByText('Are you sure you want to disconnect Atlas?'))
          .to.exist;
      });

      userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      await disconnectPromise;

      expect(atlasAuthService.signOut).to.not.have.been.called;
      expect(screen.queryByText('Disconnected from Atlas')).to.not.exist;
      expect(store.getState().userInfo).to.deep.equal({ sub: 'user-1' });
    });

    it('still clears the user when signOut throws', async function () {
      const { store, atlasAuthService } = renderStore({ sub: 'user-1' });
      await store.dispatch(refreshUserInfo());
      atlasAuthService.signOut.rejects(new Error('network error'));

      const disconnectPromise = store.dispatch(disconnect());

      await waitFor(() => {
        expect(screen.getByText('Are you sure you want to disconnect Atlas?'))
          .to.exist;
      });
      userEvent.click(screen.getByRole('button', { name: 'Disconnect' }));

      let error: Error | undefined;
      try {
        await disconnectPromise;
      } catch (err) {
        error = err as Error;
      }
      expect(error?.message).to.equal('network error');

      expect(store.getState().userInfo).to.equal(null);
      // The toast is only shown after a successful sign-out.
      expect(screen.queryByText('Disconnected from Atlas')).to.not.exist;
    });
  });
});
