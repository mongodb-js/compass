import Sinon from 'sinon';
import { expect } from 'chai';

import {
  signIn,
  cancelSignIn,
  attemptId,
  AttemptStateMap,
  signIntoAtlasWithModalPrompt,
  closeSignInModal,
  atlasServiceSignedIn,
} from './atlas-signin-reducer';
import { configureStore } from './atlas-signin-store';

describe('atlasSignInReducer', function () {
  const sandbox = Sinon.createSandbox();

  afterEach(function () {
    sandbox.reset();
  });

  describe('signIn', function () {
    it('should check authenticated state and set state to success if already authenticated', async function () {
      const mockAtlasService = {
        signIn: sandbox.stub().resolves({ sub: '1234' }),
      };
      const store = configureStore({
        atlasAuthService: mockAtlasService as any,
      });

      expect(store.getState()).to.have.nested.property('state', 'initial');
      void store.dispatch(atlasServiceSignedIn());
      await store.dispatch(signIn());
      expect(mockAtlasService.signIn).not.to.have.been.called;
      expect(store.getState()).to.have.nested.property('state', 'success');
    });

    it('should start sign in, and set state to success', async function () {
      const mockAtlasService = {
        signIn: sandbox.stub().resolves({ sub: '1234' }),
      };
      const store = configureStore({
        atlasAuthService: mockAtlasService as any,
      });

      expect(store.getState()).to.have.nested.property('state', 'initial');
      void store.dispatch(signIntoAtlasWithModalPrompt()).catch(() => {});
      await store.dispatch(signIn());
      expect(mockAtlasService.signIn).to.have.been.calledOnce;
      expect(store.getState()).to.have.nested.property('state', 'success');
    });

    it('should fail sign in if sign in failed', async function () {
      const mockAtlasService = {
        signIn: sandbox.stub().rejects(new Error('Pineapples!')),
      };
      const store = configureStore({
        atlasAuthService: mockAtlasService as any,
      });

      void store.dispatch(signIntoAtlasWithModalPrompt()).catch(() => {});
      const signInPromise = store.dispatch(signIn());
      // Avoid unhandled rejections.
      AttemptStateMap.get(attemptId)?.promise.catch(() => {});
      await signInPromise;
      expect(mockAtlasService.signIn).to.have.been.calledOnce;
      expect(store.getState()).to.have.nested.property('state', 'error');
    });
  });

  describe('cancelSignIn', function () {
    it('should do nothing if no sign in is in progress', function () {
      const store = configureStore({
        atlasAuthService: {} as any,
      });
      expect(store.getState()).to.have.nested.property('state', 'initial');
      store.dispatch(cancelSignIn());
      expect(store.getState()).to.have.nested.property('state', 'initial');
    });

    it('should cancel sign in if sign in is in progress', async function () {
      const mockAtlasService = {
        signIn: sandbox
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
        atlasAuthService: mockAtlasService as any,
      });

      void store.dispatch(signIntoAtlasWithModalPrompt()).catch(() => {});

      await Promise.all([
        store.dispatch(signIn()),
        store.dispatch(cancelSignIn()),
      ]);
      expect(store.getState()).to.have.nested.property('state', 'canceled');
    });
  });

  describe('signIntoAtlasWithModalPrompt', function () {
    it('should resolve when user finishes sign in with prompt flow', async function () {
      const mockAtlasService = {
        signIn: sandbox.stub().resolves({ sub: '1234' }),
      };
      const store = configureStore({
        atlasAuthService: mockAtlasService as any,
      });

      const signInPromise = store.dispatch(signIntoAtlasWithModalPrompt());
      await store.dispatch(signIn());
      await signInPromise;

      expect(store.getState()).to.have.property('state', 'success');
    });

    it('should reject if sign in flow fails', async function () {
      const mockAtlasService = {
        signIn: sandbox.stub().rejects(new Error('Whoops!')),
      };
      const store = configureStore({
        atlasAuthService: mockAtlasService as any,
      });

      const signInPromise = store.dispatch(signIntoAtlasWithModalPrompt());
      await store.dispatch(signIn());

      try {
        await signInPromise;
        throw new Error('Expected signInPromise to throw');
      } catch (err) {
        expect(err).to.have.property('message', 'Whoops!');
      }

      expect(store.getState()).to.have.property('state', 'error');
    });

    it('should reject if user dismissed the modal', async function () {
      const mockAtlasService = {
        signIn: sandbox.stub().resolves({ sub: '1234' }),
      };
      const store = configureStore({
        atlasAuthService: mockAtlasService as any,
      });

      const signInPromise = store.dispatch(signIntoAtlasWithModalPrompt());
      store.dispatch(closeSignInModal(new Error('This operation was aborted')));

      try {
        await signInPromise;
        throw new Error('Expected signInPromise to throw');
      } catch (err) {
        expect(err).to.have.property('message', 'This operation was aborted');
      }

      expect(store.getState()).to.have.property('state', 'canceled');
    });

    it('should reject if provided signal was aborted', async function () {
      const mockAtlasService = {
        signIn: sandbox.stub().resolves({ sub: '1234' }),
      };
      const store = configureStore({
        atlasAuthService: mockAtlasService as any,
      });

      const c = new AbortController();
      const signInPromise = store.dispatch(
        signIntoAtlasWithModalPrompt({ signal: c.signal })
      );
      c.abort(new Error('Aborted from outside'));

      try {
        await signInPromise;
        throw new Error('Expected signInPromise to throw');
      } catch (err) {
        expect(err).to.have.property('message', 'Aborted from outside');
      }

      expect(store.getState()).to.have.property('state', 'canceled');
    });
  });
});
