import React from 'react';
import { EventEmitter } from 'events';
import { screen, cleanup, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import type { AtlasAuthService } from '@mongodb-js/atlas-service/provider';
import Sinon from 'sinon';
import { expect } from 'chai';
import configureStore from '../../../test/configure-store';
import { ConnectedAtlasLoginSettings } from './atlas-login';
import { cancelAtlasLoginAttempt, signIn } from '../../stores/atlas-login';
import { closeModal } from '../../stores/settings';
import type { AtlasAiService } from '@mongodb-js/compass-generative-ai/provider';

describe('AtlasLoginSettings', function () {
  const sandbox = Sinon.createSandbox();

  beforeEach(function () {
    sandbox.reset();
  });

  afterEach(function () {
    cleanup();
  });

  function renderAtlasLoginSettings(
    atlasAuthService: Partial<AtlasAuthService>,
    atlasAiService: Partial<AtlasAiService> = {}
  ) {
    const store = configureStore({
      atlasAuthService: {
        on: sandbox.stub() as any,
        signIn: sandbox.stub().resolves({}),
        signOut: sandbox.stub().resolves(),
        ...atlasAuthService,
      } as any,
      atlasAiService: atlasAiService as any,
    });
    render(
      <Provider store={store}>
        <ConnectedAtlasLoginSettings></ConnectedAtlasLoginSettings>
      </Provider>
    );
    return { store };
  }

  it('should sign in user when signed out and sign in is clicked', async function () {
    renderAtlasLoginSettings({
      signIn: sandbox.stub().resolves({ login: 'user@mongodb.com' }),
    });

    userEvent.click(
      screen.getByRole('button', { name: /Log in with Atlas/ }),
      undefined,
      { skipPointerEventsCheck: true }
    );

    await waitFor(function () {
      // Disconnect button is a good indicator that we are signed in
      screen.getByText('Disconnect');
    });

    expect(screen.getByText('Logged in with Atlas account user@mongodb.com')).to
      .exist;

    expect(
      screen.getByRole('switch', {
        name: /Enable natural language prompts to generate/,
      })
    ).to.have.attribute('aria-checked', 'false');
  });

  it('should sign out user when signed in and sign out is clicked', async function () {
    const { store } = renderAtlasLoginSettings({
      signIn: sandbox.stub().resolves({ login: 'user@mongodb.com' }),
    });

    await store.dispatch(signIn());

    userEvent.click(
      screen.getByRole('button', { name: /Disconnect/ }),
      undefined,
      { skipPointerEventsCheck: true }
    );

    await waitFor(function () {
      // Disconnect button is a good indicator that we are signed in
      screen.getByText('Log in with Atlas');
    });

    expect(
      screen.getByText(
        'You must first connect your Atlas account to use this feature.'
      )
    ).to.exist;

    expect(
      screen.getByRole('switch', {
        name: /Enable natural language prompts to generate/,
      })
    ).to.have.attribute('aria-checked', 'false');

    expect(
      screen.getByRole('switch', {
        name: /Enable natural language prompts to generate/,
      })
    ).to.have.attribute('disabled');
  });

  it('updates state with user info on `signed-in` event', async function () {
    const emitter = new EventEmitter();
    const atlasAuthService = {
      on: emitter.on.bind(emitter),
      getUserInfo: sandbox.stub().resolves({ login: 'user@mongodb.com' }),
    } as any;

    renderAtlasLoginSettings(atlasAuthService);

    expect(
      screen.getByText(
        'You must first connect your Atlas account to use this feature.'
      )
    ).to.exist;

    emitter.emit('signed-in');

    await waitFor(function () {
      // Disconnect button is a good indicator that we are signed in
      screen.getByText('Disconnect');
    });

    expect(screen.getByText('Logged in with Atlas account user@mongodb.com')).to
      .exist;
  });

  it('resets sign in state on `signed-out` event', async function () {
    const emitter = new EventEmitter();
    const atlasAuthService = {
      on: emitter.on.bind(emitter),
      signIn: sandbox.stub().resolves({ login: 'user@mongodb.com' }),
    } as any;

    const { store } = renderAtlasLoginSettings(atlasAuthService);

    await store.dispatch(signIn());

    expect(screen.getByText('Logged in with Atlas account user@mongodb.com')).to
      .exist;

    emitter.emit('signed-out');

    await waitFor(function () {
      // Disconnect button is a good indicator that we are signed in
      screen.getByText('Log in with Atlas');
    });

    expect(
      screen.getByText(
        'You must first connect your Atlas account to use this feature.'
      )
    ).to.exist;
  });

  it('resets sign in state on `token-refresh-failed` event', async function () {
    const emitter = new EventEmitter();
    const atlasAuthService = {
      on: emitter.on.bind(emitter),
      signIn: sandbox.stub().resolves({ login: 'user@mongodb.com' }),
    } as any;

    const { store } = renderAtlasLoginSettings(atlasAuthService);

    await store.dispatch(signIn());

    expect(screen.getByText('Logged in with Atlas account user@mongodb.com')).to
      .exist;

    emitter.emit('token-refresh-failed');

    await waitFor(function () {
      // Disconnect button is a good indicator that we are signed in
      screen.getByText('Log in with Atlas');
    });

    expect(
      screen.getByText(
        'You must first connect your Atlas account to use this feature.'
      )
    ).to.exist;
  });

  it('should cancel sign in attempt on modal close', function () {
    const { store } = renderAtlasLoginSettings({
      signIn: sandbox
        .stub()
        .callsFake(({ signal }: { signal: AbortSignal }) => {
          return new Promise((_, reject) => {
            signal.addEventListener('abort', () => {
              reject(signal.reason);
            });
          });
        }),
    });

    userEvent.click(
      screen.getByRole('button', { name: /Log in with Atlas/ }),
      undefined,
      { skipPointerEventsCheck: true }
    );

    expect(store.getState()).to.have.nested.property(
      'atlasLogin.status',
      'in-progress'
    );

    store.dispatch(closeModal());

    expect(store.getState()).to.have.nested.property(
      'atlasLogin.status',
      'unauthenticated'
    );
  });

  it('should enable AI feature when toggle clicked', async function () {
    const atlasAuthService = {
      signIn: sandbox
        .stub()
        .resolves({ login: 'user@mongodb.com', enabledAIFeature: false }),
    };

    const enableFeature = sandbox.spy();

    const { store } = renderAtlasLoginSettings(atlasAuthService as any, {
      enableFeature,
    });

    await store.dispatch(signIn());

    expect(
      screen.getByRole('switch', {
        name: /Enable natural language prompts to generate/,
      })
    ).to.have.attribute('aria-checked', 'false');

    userEvent.click(
      screen.getByRole('switch', {
        name: /Enable natural language prompts to generate/,
      }),
      undefined,
      { skipPointerEventsCheck: true }
    );

    expect(enableFeature).to.have.been.calledOnce;

    await waitFor(() => {
      expect(
        screen.getByRole('switch', {
          name: /Enable natural language prompts to generate/,
        })
      ).to.have.attribute('aria-checked', 'true');
    });
  });

  it('should disable AI feature when toggle clicked', async function () {
    const atlasAuthService = {
      signIn: sandbox
        .stub()
        .resolves({ login: 'user@mongodb.com', enabledAIFeature: true }),
    };

    const disableFeature = sandbox.spy();

    const { store } = renderAtlasLoginSettings(atlasAuthService as any, {
      disableFeature,
    });

    await store.dispatch(signIn());

    expect(
      screen.getByRole('switch', {
        name: /Enable natural language prompts to generate/,
      })
    ).to.have.attribute('aria-checked', 'true');

    userEvent.click(
      screen.getByRole('switch', {
        name: /Enable natural language prompts to generate/,
      }),
      undefined,
      { skipPointerEventsCheck: true }
    );

    expect(disableFeature).to.have.been.calledOnce;

    await waitFor(() => {
      expect(
        screen.getByRole('switch', {
          name: /Enable natural language prompts to generate/,
        })
      ).to.have.attribute('aria-checked', 'false');
    });
  });

  it('should not reset sign in state if there is no sign in attempt in progress', async function () {
    const atlasAuthService = {
      signIn: sandbox
        .stub()
        .resolves({ login: 'user@mongodb.com', enabledAIFeature: false }),
      enableAIFeature: sandbox.stub().resolves(),
    };

    const { store } = renderAtlasLoginSettings(atlasAuthService);

    await store.dispatch(signIn());

    expect(store.getState()).to.have.nested.property(
      'atlasLogin.status',
      'authenticated'
    );

    store.dispatch(cancelAtlasLoginAttempt());

    expect(store.getState()).to.have.nested.property(
      'atlasLogin.status',
      'authenticated'
    );
  });
});
