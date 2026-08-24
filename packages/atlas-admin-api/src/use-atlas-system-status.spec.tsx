import React from 'react';
import { expect } from 'chai';
import Sinon from 'sinon';
import { EventEmitter } from 'events';
import {
  screen,
  render,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import {
  AtlasAuthServiceProvider,
  AtlasServiceProvider,
  useAtlasLoginActions,
} from '@mongodb-js/atlas-service/provider';
import type { AtlasUserInfo } from '@mongodb-js/atlas-service/provider';
import { AtlasAuthPlugin } from '@mongodb-js/atlas-service/renderer';
import { AtlasAdminApiServiceProvider } from './provider';
import { AtlasAdminApiService } from './atlas-admin-api-service';
import { useAtlasSystemStatus } from './use-atlas-system-status';

class FakeAtlasAuthService extends EventEmitter {
  private user: AtlasUserInfo | null;
  constructor(user: AtlasUserInfo | null) {
    super();
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
  signIn(): Promise<AtlasUserInfo> {
    return this.getUserInfo();
  }
  signOut(): Promise<void> {
    this.user = null;
    return Promise.resolve();
  }
  simulateSignIn(user: AtlasUserInfo) {
    this.user = user;
  }
}

function Consumer() {
  const username = useAtlasSystemStatus()?.username;
  const { signIn, signOut } = useAtlasLoginActions();
  return (
    <>
      <div data-testid="username">{username ?? 'none'}</div>
      <button
        data-testid="sign-out"
        onClick={() => {
          void signOut();
        }}
      />
      <button
        data-testid="sign-in"
        onClick={() => {
          void signIn();
        }}
      />
    </>
  );
}

describe('useAtlasSystemStatus', function () {
  let sandbox: Sinon.SinonSandbox;
  let getSystemStatus: Sinon.SinonStub;

  function renderConsumer(user: AtlasUserInfo | null) {
    const authService = new FakeAtlasAuthService(user);
    const Plugin = AtlasAuthPlugin.withMockServices({
      atlasAuthService: authService,
    });
    render(
      <AtlasAuthServiceProvider value={authService}>
        <AtlasServiceProvider>
          <AtlasAdminApiServiceProvider>
            <Plugin>
              <Consumer />
            </Plugin>
          </AtlasAdminApiServiceProvider>
        </AtlasServiceProvider>
      </AtlasAuthServiceProvider>
    );
    return authService;
  }

  beforeEach(function () {
    sandbox = Sinon.createSandbox();
    getSystemStatus = sandbox.stub(
      AtlasAdminApiService.prototype,
      'getSystemStatus'
    );
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('resolves the username of the signed in user', async function () {
    getSystemStatus.resolves({
      ipAddress: '1.2.3.4',
      user: { username: 'user@example.com' },
    });

    renderConsumer({ sub: 'user-1' });

    await waitFor(() => {
      expect(screen.getByTestId('username')).to.have.text('user@example.com');
    });
  });

  it('does not request the system status when signed out', async function () {
    renderConsumer(null);

    await waitFor(() => {
      expect(screen.getByTestId('username')).to.have.text('none');
    });
    expect(getSystemStatus).to.not.have.been.called;
  });

  it('does not report a resolved status for a user that is no longer signed in', async function () {
    getSystemStatus.onCall(0).resolves({
      ipAddress: '1.2.3.4',
      user: { username: 'user-1@example.com' },
    });
    // Keep the second user's request pending, so that the only status the hook
    // could report is the one resolved for the first user.
    getSystemStatus.onCall(1).returns(new Promise(() => {}));

    const authService = renderConsumer({ sub: 'user-1' });
    await waitFor(() => {
      expect(screen.getByTestId('username')).to.have.text('user-1@example.com');
    });

    userEvent.click(screen.getByTestId('sign-out'));
    await waitFor(() => {
      expect(screen.getByTestId('username')).to.have.text('none');
    });

    authService.simulateSignIn({ sub: 'user-2' });
    userEvent.click(screen.getByTestId('sign-in'));

    await waitFor(() => {
      expect(getSystemStatus).to.have.been.calledTwice;
    });
    expect(screen.getByTestId('username')).to.have.text('none');
  });
});
