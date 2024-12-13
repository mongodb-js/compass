import Sinon from 'sinon';
import { expect } from 'chai';
import { configureStore } from './atlas-ai-store';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import {
  atlasAiServiceOptedIn,
  attemptId,
  AttemptStateMap,
  cancelOptIn,
  closeOptInModal,
  optIn,
  optIntoGenAIWithModalPrompt,
} from './atlas-optin-reducer';

describe('atlasOptInReducer', function () {
  const sandbox = Sinon.createSandbox();
  let mockPreferences: PreferencesAccess;

  beforeEach(async function () {
    mockPreferences = await createSandboxFromDefaultPreferences();
    await mockPreferences.savePreferences({
      optInDataExplorerGenAIFeatures: false,
    });
  });

  afterEach(function () {
    sandbox.reset();
  });

  describe('optIn', function () {
    it('should check state and set state to success if already opted in', async function () {
      const mockAtlasAiService = {
        optIntoGenAIFeaturesAtlas: sandbox.stub().resolves({ sub: '1234' }),
      };
      const store = configureStore({
        atlasAuthService: {} as any,
        atlasAiService: mockAtlasAiService as any,
        preferences: mockPreferences,
      });

      expect(store.getState().optIn).to.have.nested.property(
        'state',
        'initial'
      );
      void store.dispatch(atlasAiServiceOptedIn());
      await store.dispatch(optIn());
      expect(mockAtlasAiService.optIntoGenAIFeaturesAtlas).not.to.have.been
        .called;
      expect(store.getState().optIn).to.have.nested.property(
        'state',
        'optin-success'
      );
    });

    it('should start opt in, and set state to success', async function () {
      const mockAtlasAiService = {
        optIntoGenAIFeaturesAtlas: sandbox.stub().resolves({ sub: '1234' }),
      };
      const store = configureStore({
        atlasAuthService: {} as any,
        atlasAiService: mockAtlasAiService as any,
        preferences: mockPreferences,
      });

      expect(store.getState().optIn).to.have.nested.property(
        'state',
        'initial'
      );
      void store.dispatch(optIntoGenAIWithModalPrompt()).catch(() => {});
      await store.dispatch(optIn());
      expect(mockAtlasAiService.optIntoGenAIFeaturesAtlas).to.have.been
        .calledOnce;
      expect(store.getState().optIn).to.have.nested.property(
        'state',
        'optin-success'
      );
    });

    describe('when already opted in, and the project setting is set to false', function () {
      beforeEach(async function () {
        await mockPreferences.savePreferences({
          enableGenAIFeaturesAtlasProject: false,
          optInDataExplorerGenAIFeatures: true,
        });
      });

      it('should start the opt in flow', async function () {
        const mockAtlasAiService = {
          optIntoGenAIFeaturesAtlas: sandbox.stub().resolves({ sub: '1234' }),
        };
        const store = configureStore({
          atlasAuthService: {} as any,
          atlasAiService: mockAtlasAiService as any,
          preferences: mockPreferences,
        });

        expect(store.getState().optIn).to.have.nested.property(
          'state',
          'initial'
        );
        void store.dispatch(optIntoGenAIWithModalPrompt()).catch(() => {});
        await store.dispatch(optIn());
        expect(mockAtlasAiService.optIntoGenAIFeaturesAtlas).to.have.been
          .calledOnce;
        expect(store.getState().optIn).to.have.nested.property(
          'state',
          'optin-success'
        );
      });
    });

    it('should fail opt in if opt in failed', async function () {
      const mockAtlasAiService = {
        optIntoGenAIFeaturesAtlas: sandbox
          .stub()
          .rejects(new Error('Whooops!')),
      };
      const store = configureStore({
        atlasAuthService: {} as any,
        atlasAiService: mockAtlasAiService as any,
        preferences: mockPreferences,
      });

      void store.dispatch(optIntoGenAIWithModalPrompt()).catch(() => {});
      const optInPromise = store.dispatch(optIn());
      // Avoid unhandled rejections.
      AttemptStateMap.get(attemptId)?.promise.catch(() => {});
      await optInPromise;
      expect(mockAtlasAiService.optIntoGenAIFeaturesAtlas).to.have.been
        .calledOnce;
      expect(store.getState().optIn).to.have.nested.property('state', 'error');
    });
  });

  describe('cancelOptIn', function () {
    it('should do nothing if no opt in is in progress', function () {
      const store = configureStore({
        atlasAuthService: {} as any,
        atlasAiService: {} as any,
        preferences: mockPreferences,
      });
      expect(store.getState().optIn).to.have.nested.property(
        'state',
        'initial'
      );
      store.dispatch(cancelOptIn());
      expect(store.getState().optIn).to.have.nested.property(
        'state',
        'initial'
      );
    });

    it('should cancel opt in if opt in is in progress', async function () {
      const mockAtlasAiService = {
        optIntoGenAIFeaturesAtlas: sandbox
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
        atlasAuthService: {} as any,
        atlasAiService: mockAtlasAiService as any,
        preferences: mockPreferences,
      });

      void store.dispatch(optIntoGenAIWithModalPrompt()).catch(() => {});

      await Promise.all([
        store.dispatch(optIn()),
        store.dispatch(cancelOptIn()),
      ]);
      expect(store.getState().optIn).to.have.nested.property(
        'state',
        'canceled'
      );
    });
  });

  describe('optIntoAtlasWithModalPrompt', function () {
    it('should resolve when user finishes opt in with prompt flow', async function () {
      const mockAtlasAiService = {
        optIntoGenAIFeaturesAtlas: sandbox.stub().resolves({ sub: '1234' }),
      };
      const store = configureStore({
        atlasAuthService: {} as any,
        atlasAiService: mockAtlasAiService as any,
        preferences: mockPreferences,
      });

      const optInPromise = store.dispatch(optIntoGenAIWithModalPrompt());
      await store.dispatch(optIn());
      await optInPromise;

      expect(store.getState().optIn).to.have.property('state', 'optin-success');
    });

    it('should reject if opt in flow fails', async function () {
      const mockAtlasAiService = {
        optIntoGenAIFeaturesAtlas: sandbox.stub().rejects(new Error('Whoops!')),
      };
      const store = configureStore({
        atlasAuthService: {} as any,
        atlasAiService: mockAtlasAiService as any,
        preferences: mockPreferences,
      });

      const optInPromise = store.dispatch(optIntoGenAIWithModalPrompt());
      await store.dispatch(optIn());

      try {
        await optInPromise;
        throw new Error('Expected optInPromise to throw');
      } catch (err) {
        expect(err).to.have.property('message', 'Whoops!');
      }

      expect(store.getState().optIn).to.have.property('state', 'error');
    });

    it('should reject if user dismissed the modal', async function () {
      const mockAtlasAiService = {
        optIntoGenAIFeaturesAtlas: sandbox.stub().resolves({ sub: '1234' }),
      };
      const store = configureStore({
        atlasAuthService: {} as any,
        atlasAiService: mockAtlasAiService as any,
        preferences: mockPreferences,
      });

      const optInPromise = store.dispatch(optIntoGenAIWithModalPrompt());
      store.dispatch(closeOptInModal(new Error('This operation was aborted')));

      try {
        await optInPromise;
        throw new Error('Expected optInPromise to throw');
      } catch (err) {
        expect(err).to.have.property('message', 'This operation was aborted');
      }

      expect(store.getState().optIn).to.have.property('state', 'canceled');
    });

    it('should reject if provided signal was aborted', async function () {
      const mockAtlasAiService = {
        optIntoGenAIFeaturesAtlas: sandbox.stub().resolves({ sub: '1234' }),
      };
      const store = configureStore({
        atlasAuthService: {} as any,
        atlasAiService: mockAtlasAiService as any,
        preferences: mockPreferences,
      });

      const c = new AbortController();
      const optInPromise = store.dispatch(
        optIntoGenAIWithModalPrompt({ signal: c.signal })
      );
      c.abort(new Error('Aborted from outside'));

      try {
        await optInPromise;
        throw new Error('Expected optInPromise to throw');
      } catch (err) {
        expect(err).to.have.property('message', 'Aborted from outside');
      }

      expect(store.getState().optIn).to.have.property('state', 'canceled');
    });
  });
});
