import React from 'react';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { Modal as AtlasSignIn } from './atlas-signin';
import { configureStore } from '../store/atlas-signin-store';
import Sinon from 'sinon';
import type { AtlasService } from '../renderer';
import { enableAIFeature, signIn } from '../store/atlas-signin-reducer';
import { expect } from 'chai';

describe('AtlasSignIn', function () {
  const sandbox = Sinon.createSandbox();
  const mockAtlasService = {
    isAuthenticated: sandbox.stub().resolves(false),
    signIn: sandbox.stub().resolves({ enabledAIFeature: false }),
    updateAtlasUserConfig: sandbox.stub().resolves(),
    on: sandbox.stub(),
    emit: sandbox.stub(),
  };

  const renderAtlasSignIn = (
    atlasService = mockAtlasService,
    props: Partial<React.ComponentProps<typeof AtlasSignIn>> = {
      restoreStateOnMount: false,
    }
  ) => {
    const store = configureStore({
      atlasService: atlasService as unknown as AtlasService,
    });
    const result = render(
      <Provider store={store}>
        <AtlasSignIn {...props}></AtlasSignIn>
      </Provider>
    );
    return { store, result };
  };

  beforeEach(function () {
    sandbox.resetHistory();
  });

  afterEach(function () {
    cleanup();
  });

  describe('restoreStateOnMount', function () {
    it('should restore authenticated state on mount if authenticated', async function () {
      const { store } = renderAtlasSignIn(
        {
          isAuthenticated: sandbox.stub().resolves(true),
          getUserInfo: sandbox.stub().resolves({ sub: '1234' }),
        } as any,
        { restoreStateOnMount: true }
      );

      expect(store.getState()).to.have.property('state', 'restoring');

      await waitFor(() => {
        expect(store.getState()).to.have.property('state', 'success');
      });

      expect(store.getState()).to.have.nested.property('userInfo.sub', '1234');
    });

    it('should not restore authenticated state on mount if not authenticated', async function () {
      const { store } = renderAtlasSignIn(
        { isAuthenticated: sandbox.stub().resolves(false) } as any,
        { restoreStateOnMount: true }
      );

      expect(store.getState()).to.have.property('state', 'restoring');

      await waitFor(() => {
        expect(store.getState()).to.have.property('state', 'unauthenticated');
      });

      expect(store.getState()).to.have.property('userInfo', null);
    });
  });

  describe('enableAIFeature', function () {
    it('should throw if trying to enable AI feature when signed out', async function () {
      const { store } = renderAtlasSignIn();
      try {
        await store.dispatch(enableAIFeature());
        expect.fail('Expected enableAIFeature to throw');
      } catch (err) {
        expect(err).to.have.property(
          'message',
          "Can't enable AI feature when signed out"
        );
      }
    });

    it('returns `true` if user accepted AI feature terms and conditions', async function () {
      const { store } = renderAtlasSignIn();
      await store.dispatch(signIn());
      const enableAIFeaturePromise = store.dispatch(enableAIFeature());

      expect(screen.getByText(/usage of it is subject to/)).to.exist;

      userEvent.click(
        screen.getByRole('button', { name: /Agree and continue/ })
      );

      expect(await enableAIFeaturePromise).to.eq(true);
      expect(mockAtlasService.updateAtlasUserConfig).to.be.calledWith({
        config: { enabledAIFeature: true },
      });
    });

    it("returns `false` if user haven't AI feature terms and conditions", async function () {
      const { store } = renderAtlasSignIn();
      await store.dispatch(signIn());
      const enableAIFeaturePromise = store.dispatch(enableAIFeature());

      expect(screen.getByText(/usage of it is subject to/)).to.exist;

      userEvent.click(screen.getByRole('button', { name: /Cancel/ }));

      expect(await enableAIFeaturePromise).to.eq(false);
      expect(mockAtlasService.updateAtlasUserConfig).to.be.calledWith({
        config: { enabledAIFeature: false },
      });
    });
  });
});
