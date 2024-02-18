import React from 'react';
import { render, cleanup, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { Modal as AtlasSignIn } from './atlas-signin';
import { configureStore } from '../store/atlas-signin-store';
import Sinon from 'sinon';
import type { AtlasAuthService } from '../renderer';
import { expect } from 'chai';

describe('AtlasSignIn', function () {
  const sandbox = Sinon.createSandbox();
  const mockAtlasService = {
    isAuthenticated: sandbox.stub().resolves(false),
    signIn: sandbox.stub().resolves({ enabledAIFeature: false }),
    on: sandbox.stub(),
    emit: sandbox.stub(),
  };

  const renderAtlasSignIn = (
    atlasAuthService = mockAtlasService,
    props: Partial<React.ComponentProps<typeof AtlasSignIn>> = {
      restoreStateOnMount: false,
    }
  ) => {
    const store = configureStore({
      atlasAuthService: atlasAuthService as unknown as AtlasAuthService,
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
});
