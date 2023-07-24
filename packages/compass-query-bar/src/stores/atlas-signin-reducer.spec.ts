import Sinon from 'sinon';
import { configureStore } from './query-bar-store';
import {
  getInitialSignInState,
  signIn,
  cancelSignIn,
} from './atlas-signin-reducer';
import { expect } from 'chai';

import why from 'why-is-node-running';

describe('atlasSignInReducer', function () {
  const sandbox = Sinon.createSandbox();

  afterEach(function () {
    sandbox.reset();
  });

  after(function () {
    why();
  });

  describe('getInitialSignInState', function () {
    it('should check authentication and set state to success if authenticated', async function () {
      const mockAtlasService = {
        isAuthenticated: sandbox.stub().resolves(true),
      };
      const store = configureStore({
        atlasService: mockAtlasService as any,
        restoreSignInStateOnCreate: false,
      });
      await store.dispatch(getInitialSignInState());
      expect(mockAtlasService.isAuthenticated).to.have.been.calledOnce;
      expect(store.getState()).to.have.nested.property(
        'atlasSignIn.state',
        'success'
      );
    });

    it('should set state to unauthenticated if not authenticated', async function () {
      const mockAtlasService = {
        isAuthenticated: sandbox.stub().resolves(false),
      };
      const store = configureStore({
        atlasService: mockAtlasService as any,
        restoreSignInStateOnCreate: false,
      });
      await store.dispatch(getInitialSignInState());
      expect(store.getState()).to.have.nested.property(
        'atlasSignIn.state',
        'unauthenticated'
      );
    });

    it('should set state to unauthenticated if check fails', async function () {
      const mockAtlasService = {
        isAuthenticated: sandbox.stub().rejects(new Error('Whoops!')),
      };
      const store = configureStore({
        atlasService: mockAtlasService as any,
        restoreSignInStateOnCreate: false,
      });
      await store.dispatch(getInitialSignInState());
      expect(store.getState()).to.have.nested.property(
        'atlasSignIn.state',
        'unauthenticated'
      );
    });
  });

  describe('signIn', function () {
    it('should check authenticated state and set state to success if already autenticated', async function () {
      const mockAtlasService = {
        isAuthenticated: sandbox.stub().resolves(true),
        signIn: sandbox.stub().resolves({}),
        getUserInfo: sandbox.stub().resolves({}),
      };
      const store = configureStore({
        atlasService: mockAtlasService as any,
        restoreSignInStateOnCreate: false,
      });

      await store.dispatch(signIn());
      expect(mockAtlasService.isAuthenticated).to.have.been.calledOnce;
      expect(mockAtlasService.signIn).not.to.have.been.called;
      expect(store.getState()).to.have.nested.property(
        'atlasSignIn.state',
        'success'
      );
    });

    it('should check authenticated state, start sign in, and set state to success', async function () {
      const mockAtlasService = {
        isAuthenticated: sandbox.stub().resolves(false),
        signIn: sandbox.stub().resolves({}),
        getUserInfo: sandbox.stub().resolves({}),
      };
      const store = configureStore({
        atlasService: mockAtlasService as any,
        restoreSignInStateOnCreate: false,
      });

      await store.dispatch(signIn());
      expect(mockAtlasService.isAuthenticated).to.have.been.calledOnce;
      expect(mockAtlasService.signIn).to.have.been.calledOnce;
      expect(store.getState()).to.have.nested.property(
        'atlasSignIn.state',
        'success'
      );
    });

    it('should fail sign in if sign in failed', async function () {
      const mockAtlasService = {
        isAuthenticated: sandbox.stub().resolves(false),
        signIn: sandbox.stub().rejects(new Error('Whooops!')),
      };
      const store = configureStore({
        atlasService: mockAtlasService as any,
        restoreSignInStateOnCreate: false,
      });

      await store.dispatch(signIn());
      expect(mockAtlasService.isAuthenticated).to.have.been.calledOnce;
      expect(mockAtlasService.signIn).to.have.been.calledOnce;
      expect(store.getState()).to.have.nested.property(
        'atlasSignIn.state',
        'error'
      );
    });
  });

  describe('cancelSignIn', function () {
    it('should cancel state restoration if state restoration is in progress', async function () {
      const mockAtlasService = {
        isAuthenticated: sandbox
          .stub()
          .callsFake(({ signal }: { signal: AbortSignal }) => {
            return new Promise((resolve, reject) => {
              signal.addEventListener('abort', () => {
                reject(signal.reason);
              });
            });
          }),
      };
      const store = configureStore({
        atlasService: mockAtlasService as any,
        restoreSignInStateOnCreate: false,
      });

      await Promise.all([
        store.dispatch(getInitialSignInState()),
        store.dispatch(cancelSignIn()),
      ]);
      expect(store.getState()).to.have.nested.property(
        'atlasSignIn.state',
        'canceled'
      );
    });

    it('should cancel sign in if sign in is in progress', async function () {
      const mockAtlasService = {
        isAuthenticated: sandbox
          .stub()
          .callsFake(({ signal }: { signal: AbortSignal }) => {
            return new Promise((resolve, reject) => {
              signal.addEventListener('abort', () => {
                reject(signal.reason);
              });
            });
          }),
      };
      const store = configureStore({
        atlasService: mockAtlasService as any,
        restoreSignInStateOnCreate: false,
      });

      await Promise.all([
        store.dispatch(signIn()),
        store.dispatch(cancelSignIn()),
      ]);
      expect(store.getState()).to.have.nested.property(
        'atlasSignIn.state',
        'canceled'
      );
    });
  });
});
