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
      await store.dispatch(signIn({ entrypoint: 'unknown' }));
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

      await store.dispatch(signIn({ entrypoint: 'unknown' }));
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

      await store.dispatch(signIn({ entrypoint: 'unknown' }));
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

      const signInPromise = store.dispatch(signIn({ entrypoint: 'unknown' }));
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
      store.dispatch(cancelSignIn('canceled'));
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
      const track = sandbox.stub();
      const store = configureStore({
        atlasAuthService: mockAtlasService as any,
        track,
      });

      void store.dispatch(performSignInAttempt());

      // Give it some time for start the sign in attempt. It will be waiting
      // at isAuthenticated, which never resolves.
      await new Promise((resolve) => setTimeout(resolve, 100));
      store.dispatch(cancelSignIn('canceled'));
      expect(store.getState()).to.have.nested.property('state', 'canceled');
      expect(store.getState()).to.have.property('attemptNumber', 2);

      expect(isAuthenticatedStub).to.have.been.calledOnce;
      expect(track).to.have.been.calledWith('Atlas Sign In Canceled', {});
    });

    it('should not track a cancel when no sign in is in progress', function () {
      const track = sandbox.stub();
      const store = configureStore({
        atlasAuthService: {} as any,
        track,
      });

      store.dispatch(cancelSignIn('canceled'));

      expect(track).to.not.have.been.calledWith('Atlas Sign In Canceled');
    });
  });

  describe('sign in timeout', function () {
    let clock: Sinon.SinonFakeTimers;
    const ENTRYPOINT = 'assistant-tool-atlas-connection-error-debugger';

    beforeEach(function () {
      clock = sandbox.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(function () {
      clock.restore();
      sandbox.restore();
    });

    async function driveToTimeout() {
      const isAuthenticatedStub = sandbox
        .stub()
        .callsFake(({ signal }: { signal: AbortSignal }) => {
          return new Promise((_resolve, reject) => {
            signal.addEventListener('abort', () => {
              reject(signal.reason);
            });
          });
        });
      const track = sandbox.stub();
      const openToast = sandbox.stub();
      sandbox.replaceGetter(compassComponents, 'openToast', () => openToast);
      const store = configureStore({
        atlasAuthService: { isAuthenticated: isAuthenticatedStub } as any,
        track,
      });

      const attemptPromise = store.dispatch(
        performSignInAttempt({ entrypoint: ENTRYPOINT })
      );

      await clock.tickAsync(0);
      expect(store.getState()).to.have.nested.property('state', 'in-progress');

      // Advance past the timeout.
      await clock.tickAsync(SIGN_IN_TIMEOUT_MS);
      const result = await attemptPromise;

      return { store, track, openToast, result };
    }

    it('resets the state to timed out', async function () {
      const { store, result } = await driveToTimeout();

      expect(store.getState()).to.have.nested.property('state', 'timed-out');
      expect(store.getState()).to.have.property('attemptNumber', 2);
      expect(store.getState()).to.have.nested.property(
        'currentAttemptId',
        null
      );
      expect(result).to.deep.equal({ status: 'timed-out' });
    });

    it('tracks the timed out event with the entrypoint', async function () {
      const { track } = await driveToTimeout();

      expect(
        track.withArgs('Atlas Sign In Timed Out', { entrypoint: ENTRYPOINT })
      ).to.have.been.calledOnce;
    });

    it('shows a toast informing the user that sign in timed out', async function () {
      const { openToast } = await driveToTimeout();

      expect(openToast.withArgs('atlas-timed-out')).to.have.been.calledOnce;
      expect(openToast.lastCall.args[1]).to.include({
        title: 'The login to Atlas has timed out, please try again.',
        variant: 'note',
      });
    });

    it('should not time out if the flow completes before the timeout', async function () {
      const track = sandbox.stub();
      const store = configureStore({
        atlasAuthService: {
          isAuthenticated: sandbox.stub().resolves(false),
          signIn: sandbox.stub().resolves({ sub: '1234' }),
          getUserInfo: sandbox.stub().resolves({ sub: '1234' }),
        } as any,
        track,
      });

      const result = await store.dispatch(performSignInAttempt());
      expect(result).to.have.property('status', 'success');
      expect(store.getState()).to.have.property('state', 'success');

      await clock.tickAsync(SIGN_IN_TIMEOUT_MS);
      expect(store.getState()).to.have.property('state', 'success');
      expect(track).to.not.have.been.calledWith('Atlas Sign In Timed Out');
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
      expect(store.getState()).to.have.property('attemptNumber', 2);
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
      expect(track).to.have.been.calledWith('Atlas Sign In Started', {
        entrypoint: 'assistant-tool-atlas-connection-error-debugger',
        attempt: 1,
        previousOutcome: null,
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
      expect(track).to.have.been.calledWith('Atlas Sign In Started', {
        entrypoint: 'unknown',
        attempt: 1,
        previousOutcome: null,
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

  describe('sign in attempt tracking (retries)', function () {
    let clock: Sinon.SinonFakeTimers;
    const ENTRYPOINT = 'assistant-tool-atlas-connection-error-debugger';

    beforeEach(function () {
      clock = sandbox.useFakeTimers({ shouldAdvanceTime: true });
      sandbox.replaceGetter(compassComponents, 'openToast', () =>
        sandbox.stub()
      );
    });

    afterEach(function () {
      clock.restore();
      sandbox.restore();
    });

    function startedCalls(track: Sinon.SinonStub) {
      return track
        .getCalls()
        .filter((call) => call.args[0] === 'Atlas Sign In Started')
        .map((call) => call.args[1]);
    }

    async function attemptThenTimeout(store: any) {
      const attemptPromise = store.dispatch(
        performSignInAttempt({ entrypoint: ENTRYPOINT })
      );
      await clock.tickAsync(0);
      await clock.tickAsync(SIGN_IN_TIMEOUT_MS);
      await attemptPromise;
    }

    it('first attempt, previousOutcome is null', async function () {
      const track = sandbox.stub();
      const store = configureStore({
        atlasAuthService: {
          isAuthenticated: sandbox.stub().resolves(false),
          signIn: sandbox.stub().resolves({ sub: '1234' }),
          getUserInfo: sandbox.stub().resolves({ sub: '1234' }),
        } as any,
        track,
      });

      await store.dispatch(performSignInAttempt({ entrypoint: ENTRYPOINT }));

      expect(startedCalls(track)).to.deep.equal([
        { entrypoint: ENTRYPOINT, attempt: 1, previousOutcome: null },
      ]);
    });

    it('after a timeout, retrying increases attempt number and fill previousOutcome', async function () {
      const track = sandbox.stub();
      const store = configureStore({
        atlasAuthService: {
          isAuthenticated: sandbox
            .stub()
            .callsFake(({ signal }: { signal: AbortSignal }) => {
              return new Promise((_resolve, reject) => {
                signal.addEventListener('abort', () => reject(signal.reason));
              });
            }),
        } as any,
        track,
      });

      await attemptThenTimeout(store);

      const secondPromise = store.dispatch(
        performSignInAttempt({ entrypoint: ENTRYPOINT })
      );
      await clock.tickAsync(0);

      expect(startedCalls(track)).to.deep.equal([
        { entrypoint: ENTRYPOINT, attempt: 1, previousOutcome: null },
        { entrypoint: ENTRYPOINT, attempt: 2, previousOutcome: 'timed-out' },
      ]);

      await clock.tickAsync(SIGN_IN_TIMEOUT_MS);
      await secondPromise;
    });

    it('after a cancel, reports the previous outcome as canceled when retrying', async function () {
      const track = sandbox.stub();
      const store = configureStore({
        atlasAuthService: {
          isAuthenticated: sandbox
            .stub()
            .callsFake(({ signal }: { signal: AbortSignal }) => {
              return new Promise((_resolve, reject) => {
                signal.addEventListener('abort', () => reject(signal.reason));
              });
            }),
        } as any,
        track,
      });

      const c = new AbortController();
      const firstPromise = store.dispatch(
        performSignInAttempt({ entrypoint: ENTRYPOINT, signal: c.signal })
      );
      await clock.tickAsync(0);
      c.abort(new Error('user canceled'));
      await firstPromise;

      const secondPromise = store.dispatch(
        performSignInAttempt({ entrypoint: ENTRYPOINT })
      );
      await clock.tickAsync(0);

      expect(startedCalls(track)).to.deep.equal([
        { entrypoint: ENTRYPOINT, attempt: 1, previousOutcome: null },
        { entrypoint: ENTRYPOINT, attempt: 2, previousOutcome: 'canceled' },
      ]);

      await clock.tickAsync(SIGN_IN_TIMEOUT_MS);
      await secondPromise;
    });

    it('after a failure, reports the previous outcome as error when retrying', async function () {
      const track = sandbox.stub();
      const store = configureStore({
        atlasAuthService: {
          isAuthenticated: sandbox.stub().resolves(false),
          signIn: sandbox.stub().rejects(new Error('Sign in failed')),
          getUserInfo: sandbox.stub().resolves({ sub: '1234' }),
        } as any,
        track,
      });

      await store.dispatch(performSignInAttempt({ entrypoint: ENTRYPOINT }));
      await store.dispatch(performSignInAttempt({ entrypoint: ENTRYPOINT }));

      expect(startedCalls(track)).to.deep.equal([
        { entrypoint: ENTRYPOINT, attempt: 1, previousOutcome: null },
        { entrypoint: ENTRYPOINT, attempt: 2, previousOutcome: 'error' },
      ]);
    });

    it('resets the attempt number after a successful sign in', function () {
      const store = configureStore({ atlasAuthService: {} as any });

      store.dispatch({
        type: 'atlas-service/atlas-signin/AttemptStart',
        id: 1,
      });
      store.dispatch({
        type: 'atlas-service/atlas-signin/AtlasSignInError',
        error: 'some error',
      });
      expect(store.getState()).to.have.property('attemptNumber', 2);

      store.dispatch({
        type: 'atlas-service/atlas-signin/AtlasSignInSuccess',
        userInfo: { sub: '1234' },
      });
      expect(store.getState()).to.have.property('attemptNumber', 1);
    });

    it('increments attemptNumber on each AttemptStart', function () {
      const store = configureStore({ atlasAuthService: {} as any });

      expect(store.getState()).to.have.property('attemptNumber', 1);
      store.dispatch({
        type: 'atlas-service/atlas-signin/AttemptStart',
        id: 1,
      });
      expect(store.getState()).to.have.property('attemptNumber', 2);
      store.dispatch({ type: 'atlas-service/atlas-signin/AttemptEnd', id: 1 });
      store.dispatch({
        type: 'atlas-service/atlas-signin/AtlasSignInTimedOut',
      });
      store.dispatch({
        type: 'atlas-service/atlas-signin/AttemptStart',
        id: 2,
      });
      expect(store.getState()).to.have.property('attemptNumber', 3);
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
