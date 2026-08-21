import Sinon from 'sinon';
import {
  restoreSignInState,
  signIn,
  cancelSignIn,
  attemptId,
  AttemptStateMap,
  performSignInAttempt,
  signOut,
  SIGN_IN_TIMEOUT_MS,
} from './atlas-signin-reducer';
import { expect } from 'chai';
import { configureStore } from './atlas-signin-store';
import * as compassComponents from '@mongodb-js/compass-components';

describe('atlasSignInReducer', function () {
  const sandbox = Sinon.createSandbox();

  afterEach(function () {
    sandbox.reset();
  });

  describe('restoreSignInState', function () {
    it('should check authentication and set state to success if authenticated', async function () {
      const mockAtlasService = {
        isAuthenticated: sandbox.stub().resolves(true),
        getUserInfo: sandbox.stub().resolves({ sub: '1234' }),
      };
      const store = configureStore({
        atlasAuthService: mockAtlasService as any,
      });
      await store.dispatch(restoreSignInState());
      expect(mockAtlasService.isAuthenticated).to.have.been.calledOnce;
      expect(store.getState()).to.have.nested.property('state', 'success');
    });

    it('should set state to unauthenticated if not authenticated', async function () {
      const mockAtlasService = {
        isAuthenticated: sandbox.stub().resolves(false),
      };
      const store = configureStore({
        atlasAuthService: mockAtlasService as any,
      });
      await store.dispatch(restoreSignInState());
      expect(store.getState()).to.have.nested.property(
        'state',
        'unauthenticated'
      );
    });

    it('should set state to unauthenticated if check fails', async function () {
      const mockAtlasService = {
        isAuthenticated: sandbox.stub().rejects(new Error('Whoops!')),
      };
      const store = configureStore({
        atlasAuthService: mockAtlasService as any,
      });
      await store.dispatch(restoreSignInState());
      expect(store.getState()).to.have.nested.property(
        'state',
        'unauthenticated'
      );
    });

    it('should do nothing if user initiated sign in while restore was in progress', async function () {
      let resolve: (val?: unknown) => void = () => {};
      const promise = new Promise((res) => {
        resolve = res;
      });
      // We are simulating a situation where we started state restoration, but
      // while isAuthenticated check was inflight, user manually went through
      // sign in flow that ended successfully
      const mockAtlasService = {
        isAuthenticated: sandbox
          .stub()
          .onFirstCall()
          .returns(promise)
          .onSecondCall()
          .resolves(true),
        getUserInfo: sandbox.stub().resolves({ sub: '1234' }),
      };
      const store = configureStore({
        atlasAuthService: mockAtlasService as any,
      });
      const restorePromise = store.dispatch(restoreSignInState());
      expect(mockAtlasService.isAuthenticated).to.have.been.calledOnce;
      expect(store.getState()).to.have.nested.property('state', 'restoring');
      await store.dispatch(signIn());
      expect(mockAtlasService.isAuthenticated).to.have.been.calledTwice;
      expect(store.getState()).to.have.nested.property('state', 'success');
      // Intentionally returning false here so that if action would affect
      // state, the state values would unexpectedly change
      resolve(false);
      await restorePromise;
      expect(store.getState()).to.have.nested.property('state', 'success');
    });
  });

  describe('signIn', function () {
    it('should check authenticated state and set state to success if already autenticated', async function () {
      const mockAtlasService = {
        isAuthenticated: sandbox.stub().resolves(true),
        signIn: sandbox.stub().resolves({ sub: '1234' }),
        getUserInfo: sandbox.stub().resolves({ sub: '1234' }),
      };
      const store = configureStore({
        atlasAuthService: mockAtlasService as any,
      });

      await store.dispatch(signIn());
      expect(mockAtlasService.isAuthenticated).to.have.been.calledOnce;
      expect(mockAtlasService.signIn).not.to.have.been.called;
      expect(store.getState()).to.have.nested.property('state', 'success');
    });

    it('should check authenticated state, start sign in, and set state to success', async function () {
      const mockAtlasService = {
        isAuthenticated: sandbox.stub().resolves(false),
        signIn: sandbox.stub().resolves({ sub: '1234' }),
        getUserInfo: sandbox.stub().resolves({ sub: '1234' }),
      };
      const store = configureStore({
        atlasAuthService: mockAtlasService as any,
      });

      await store.dispatch(signIn());
      expect(mockAtlasService.isAuthenticated).to.have.been.calledOnce;
      expect(mockAtlasService.signIn).to.have.been.calledOnce;
      expect(store.getState()).to.have.nested.property('state', 'success');
    });

    it('should fail sign in if sign in failed', async function () {
      const mockAtlasService = {
        isAuthenticated: sandbox.stub().resolves(false),
        signIn: sandbox.stub().rejects(new Error('Whooops!')),
      };
      const store = configureStore({
        atlasAuthService: mockAtlasService as any,
      });

      const signInPromise = store.dispatch(signIn());
      // Avoid unhandled rejections
      AttemptStateMap.get(attemptId)?.promise.catch(() => {});
      await signInPromise;
      expect(mockAtlasService.isAuthenticated).to.have.been.calledOnce;
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
      const isAuthenticatedStub = sandbox
        .stub()
        .callsFake(({ signal }: { signal: AbortSignal }) => {
          return new Promise((resolve, reject) => {
            signal.addEventListener('abort', () => {
              reject(signal.reason);
            });
          });
        });
      const mockAtlasService = {
        isAuthenticated: isAuthenticatedStub,
      };
      const store = configureStore({
        atlasAuthService: mockAtlasService as any,
      });

      void store.dispatch(performSignInAttempt());

      // Give it some time for start the sign in attempt. It will be waiting
      // at isAuthenticated, which never resolves.
      await new Promise((resolve) => setTimeout(resolve, 100));
      store.dispatch(cancelSignIn());
      expect(store.getState()).to.have.nested.property('state', 'canceled');

      expect(isAuthenticatedStub).to.have.been.calledOnce;
    });
  });

  describe('sign in timeout', function () {
    let clock: Sinon.SinonFakeTimers;

    beforeEach(function () {
      clock = sandbox.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(function () {
      clock.restore();
    });

    it('should time out and reset the state if the flow does not complete in time', async function () {
      const isAuthenticatedStub = sandbox
        .stub()
        .callsFake(({ signal }: { signal: AbortSignal }) => {
          return new Promise((_resolve, reject) => {
            signal.addEventListener('abort', () => {
              reject(signal.reason);
            });
          });
        });
      const store = configureStore({
        atlasAuthService: { isAuthenticated: isAuthenticatedStub } as any,
      });

      const attemptPromise = store.dispatch(performSignInAttempt());

      await clock.tickAsync(0);
      expect(store.getState()).to.have.nested.property('state', 'in-progress');

      // Advance past the timeout.
      await clock.tickAsync(SIGN_IN_TIMEOUT_MS);

      expect(store.getState()).to.have.nested.property('state', 'timed-out');
      expect(store.getState()).to.have.nested.property(
        'currentAttemptId',
        null
      );
      expect(await attemptPromise).to.deep.equal({ status: 'timed-out' });
    });

    it('should not time out if the flow completes before the timeout', async function () {
      const store = configureStore({
        atlasAuthService: {
          isAuthenticated: sandbox.stub().resolves(false),
          signIn: sandbox.stub().resolves({ sub: '1234' }),
          getUserInfo: sandbox.stub().resolves({ sub: '1234' }),
        } as any,
      });

      const result = await store.dispatch(performSignInAttempt());
      expect(result).to.have.property('status', 'success');
      expect(store.getState()).to.have.property('state', 'success');

      await clock.tickAsync(SIGN_IN_TIMEOUT_MS);
      expect(store.getState()).to.have.property('state', 'success');
    });
  });

  describe('performSignInAttempt', function () {
    it('should resolve with a success result when sign in flow finishes', async function () {
      const mockAtlasService = {
        isAuthenticated: sandbox.stub().resolves(false),
        signIn: sandbox.stub().resolves({ sub: '1234' }),
        getUserInfo: sandbox.stub().resolves({ sub: '1234' }),
      };
      const store = configureStore({
        atlasAuthService: mockAtlasService as any,
      });
      const result = await store.dispatch(performSignInAttempt());
      expect(result).to.deep.equal({
        status: 'success',
        userInfo: { sub: '1234' },
      });
      expect(store.getState()).to.have.property('state', 'success');
    });

    it('should resolve with an error result if sign in fails', async function () {
      const mockAtlasService = {
        isAuthenticated: sandbox.stub().resolves(false),
        signIn: sandbox.stub().rejects(new Error('Sign in failed')),
        getUserInfo: sandbox.stub().resolves({ sub: '1234' }),
      };
      const store = configureStore({
        atlasAuthService: mockAtlasService as any,
      });
      const result = await store.dispatch(performSignInAttempt());
      expect(result).to.have.property('status', 'error');
      expect(result).to.have.nested.property('error.message', 'Sign in failed');
      expect(store.getState()).to.have.property('state', 'error');
    });

    it('should resolve with a canceled result if provided signal was aborted', async function () {
      let resolveSignInCalled = () => {};
      const signInCalled: Promise<void> = new Promise(
        (resolve) => (resolveSignInCalled = resolve)
      );
      const mockAtlasService = {
        isAuthenticated: sandbox.stub().resolves(false),
        signIn: sandbox.stub().callsFake(() => {
          resolveSignInCalled();
          return { sub: '1234' };
        }),
        getUserInfo: sandbox.stub().resolves({ sub: '1234' }),
      };
      const store = configureStore({
        atlasAuthService: mockAtlasService as any,
      });
      const c = new AbortController();
      const signInPromise = store.dispatch(
        performSignInAttempt({ signal: c.signal })
      );
      c.abort(new Error('Aborted from outside'));
      expect(await signInPromise).to.deep.equal({ status: 'canceled' });
      expect(store.getState()).to.have.property('state', 'canceled');

      // Ensure that we are not leaving a dangling store operation that would conflict with our mocks being reset.
      await signInCalled;
    });

    it('should join the existing attempt if one is already in progress', async function () {
      const mockAtlasService = {
        isAuthenticated: sandbox.stub().resolves(false),
        signIn: sandbox.stub().resolves({ sub: '1234' }),
        getUserInfo: sandbox.stub().resolves({ sub: '1234' }),
      };
      const store = configureStore({
        atlasAuthService: mockAtlasService as any,
      });

      const firstAttemptPromise = store.dispatch(performSignInAttempt());
      const secondAttemptPromise = store.dispatch(performSignInAttempt());

      const [firstResult, secondResult] = await Promise.all([
        firstAttemptPromise,
        secondAttemptPromise,
      ]);

      // the second call should not have triggered a second signIn call, and both should resolve to the same result
      expect(mockAtlasService.signIn).to.have.been.calledOnce;
      expect(firstResult).to.deep.equal({
        status: 'success',
        userInfo: { sub: '1234' },
      });
      expect(firstResult).to.deep.equal(secondResult);
      expect(store.getState()).to.have.property('state', 'success');
    });

    it('should track sign in started with the provided entrypoint', async function () {
      const mockAtlasService = {
        isAuthenticated: sandbox.stub().resolves(false),
        signIn: sandbox.stub().resolves({ sub: '1234' }),
        getUserInfo: sandbox.stub().resolves({ sub: '1234' }),
        emit: sandbox.stub(),
      };
      const track = sandbox.stub();
      const store = configureStore({
        atlasAuthService: mockAtlasService as any,
        track,
      });
      await store.dispatch(
        performSignInAttempt({
          entrypoint: 'assistant-tool-atlas-connection-error-debugger',
        })
      );
      expect(track).to.have.been.calledOnceWith('Atlas Sign In Started', {
        entrypoint: 'assistant-tool-atlas-connection-error-debugger',
      });
    });

    it('should track sign in started with an unknown entrypoint by default', async function () {
      const mockAtlasService = {
        isAuthenticated: sandbox.stub().resolves(false),
        signIn: sandbox.stub().resolves({ sub: '1234' }),
        getUserInfo: sandbox.stub().resolves({ sub: '1234' }),
        emit: sandbox.stub(),
      };
      const track = sandbox.stub();
      const store = configureStore({
        atlasAuthService: mockAtlasService as any,
        track,
      });
      await store.dispatch(performSignInAttempt());
      expect(track).to.have.been.calledOnceWith('Atlas Sign In Started', {
        entrypoint: 'unknown',
      });
    });

    it('should not track sign in started when already signed in', async function () {
      const mockAtlasService = {
        isAuthenticated: sandbox.stub().resolves(true),
        getUserInfo: sandbox.stub().resolves({ sub: '1234' }),
        emit: sandbox.stub(),
      };
      const track = sandbox.stub();
      const store = configureStore({
        atlasAuthService: mockAtlasService as any,
        track,
      });
      await store.dispatch(restoreSignInState());
      await store.dispatch(performSignInAttempt());
      expect(track).to.not.have.been.called;
    });
  });

  describe('signOut', function () {
    let openToastStub: Sinon.SinonStub;

    beforeEach(function () {
      openToastStub = sandbox.stub();
      sandbox.replaceGetter(
        compassComponents,
        'openToast',
        () => openToastStub
      );
    });

    afterEach(function () {
      sandbox.restore();
    });

    function createSignedInStore(mockAtlasService: any) {
      const store = configureStore({
        atlasAuthService: mockAtlasService,
      });
      store.dispatch({
        type: 'atlas-service/atlas-signin/AtlasSignInSuccess',
        userInfo: { sub: '1234' },
      });
      return store;
    }

    it('should sign out and reset state', async function () {
      const mockAtlasService = {
        signOut: sandbox.stub().resolves(),
      };
      const store = createSignedInStore(mockAtlasService);

      await store.dispatch(signOut());

      expect(mockAtlasService.signOut).to.have.been.calledOnce;
      expect(store.getState()).to.have.nested.property('state', 'initial');
      expect(store.getState()).to.have.nested.property('userInfo', null);
    });

    it('should show a toast notifying the user that Atlas was disconnected', async function () {
      const mockAtlasService = {
        signOut: sandbox.stub().resolves(),
      };
      const store = createSignedInStore(mockAtlasService);

      await store.dispatch(signOut());

      expect(openToastStub).to.have.been.calledOnce;
      expect(openToastStub.firstCall.args[1]).to.include({
        title: 'Disconnected from Atlas',
        variant: 'note',
      });
    });

    it('should show failed toast if signOut rejects', async function () {
      const mockAtlasService = {
        signOut: sandbox.stub().rejects(new Error('Whoops!')),
      };
      const store = createSignedInStore(mockAtlasService);

      await store.dispatch(signOut());

      expect(mockAtlasService.signOut).to.have.been.calledOnce;
      expect(openToastStub).to.have.been.calledOnce;
      expect(openToastStub.firstCall.args[1]).to.include({
        title: 'Failed to disconnect from Atlas',
        variant: 'warning',
      });
    });
  });
});
