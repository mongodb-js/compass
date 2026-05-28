/* eslint-disable @typescript-eslint/unbound-method */
import { expect } from 'chai';
import Sinon from 'sinon';
import {
  fetchSettings,
  changeFieldValue,
  saveSettings,
  selectWillPurgeOIDCTokens,
} from './settings';
import configureStore from '../../test/configure-store';

describe('Settings store actions', function () {
  const sinonSandbox = Sinon.createSandbox();

  const preferencesSandbox = {
    setupSandbox: sinonSandbox.stub().resolves(),
    updateField: sinonSandbox.stub().resolves(),
    applySandboxChangesToPreferences: sinonSandbox.stub().resolves(),
    getSandboxState: sinonSandbox.stub().resolves({
      userPreferences: { theme: 'LIGHT' },
      preferenceStates: {},
      updatedFields: [],
    }),
  };

  afterEach(function () {
    sinonSandbox.restore();
  });

  describe('fetchSettings', function () {
    it('fetches current settings and adds them to the state', async function () {
      const store = configureStore({ preferencesSandbox });
      const actionPromise = store.dispatch(fetchSettings() as any);
      expect(store.getState()).to.have.nested.property(
        'settings.loadingState',
        'loading'
      );
      await actionPromise;
      expect(store.getState()).to.have.nested.property(
        'settings.loadingState',
        'ready'
      );
      expect(store.getState())
        .to.have.nested.property('settings.settings')
        .deep.eq({ theme: 'LIGHT' });
      expect(store.getState())
        .to.have.nested.property('settings.updatedFields')
        .deep.eq([]);
    });
  });

  describe('changeFieldValue', function () {
    it('updates the value of a single field', async function () {
      const store = configureStore({ preferencesSandbox });
      await store.dispatch(fetchSettings() as any);
      await store.dispatch(changeFieldValue('readOnly', true) as any);
      expect(preferencesSandbox.updateField).to.have.been.calledOnceWithExactly(
        'readOnly',
        true
      );
    });

    it('tracks a "Setting Changed" event', async function () {
      const track = sinonSandbox.stub();
      const store = configureStore({ preferencesSandbox, track });
      await store.dispatch(fetchSettings() as any);
      await store.dispatch(changeFieldValue('readOnly', true) as any);
      expect(track).to.have.been.calledWith('Setting Changed', {
        setting: 'readOnly',
      });
    });

    it('tracks each setting change individually', async function () {
      const track = sinonSandbox.stub();
      const store = configureStore({ preferencesSandbox, track });
      await store.dispatch(fetchSettings() as any);
      await store.dispatch(changeFieldValue('readOnly', true) as any);
      await store.dispatch(changeFieldValue('enableShell', false) as any);
      expect(track).to.have.been.calledWith('Setting Changed', {
        setting: 'readOnly',
      });
      expect(track).to.have.been.calledWith('Setting Changed', {
        setting: 'enableShell',
      });
    });
  });

  describe('saveSettings', function () {
    it('updates the global preferences struct', async function () {
      const store = configureStore({ preferencesSandbox });
      await store.dispatch(fetchSettings() as any);
      await store.dispatch(saveSettings() as any);
      expect(preferencesSandbox.applySandboxChangesToPreferences).to.have.been
        .calledOnce;
    });
  });

  describe('selectWillPurgeOIDCTokens', function () {
    it('returns false while settings are still loading', function () {
      const store = configureStore({ preferencesSandbox });
      expect(selectWillPurgeOIDCTokens(store.getState())).to.be.false;
    });

    it('returns false when persistOIDCTokens was already false when modal opened', async function () {
      const sandbox = {
        ...preferencesSandbox,
        getSandboxState: sinonSandbox.stub().resolves({
          userPreferences: { persistOIDCTokens: false },
          preferenceStates: {},
          updatedFields: [],
        }),
      };
      const store = configureStore({ preferencesSandbox: sandbox });
      await store.dispatch(fetchSettings() as any);
      expect(selectWillPurgeOIDCTokens(store.getState())).to.be.false;
    });

    it('returns false when persistOIDCTokens is true and unchanged', async function () {
      const sandbox = {
        ...preferencesSandbox,
        getSandboxState: sinonSandbox.stub().resolves({
          userPreferences: { persistOIDCTokens: true },
          preferenceStates: {},
          updatedFields: [],
        }),
      };
      const store = configureStore({ preferencesSandbox: sandbox });
      await store.dispatch(fetchSettings() as any);
      expect(selectWillPurgeOIDCTokens(store.getState())).to.be.false;
    });

    it('returns true immediately (synchronously) when user unchecks persistOIDCTokens', async function () {
      const sandbox = {
        ...preferencesSandbox,
        getSandboxState: sinonSandbox.stub().resolves({
          userPreferences: { persistOIDCTokens: true },
          preferenceStates: {},
          updatedFields: [],
        }),
      };
      const store = configureStore({ preferencesSandbox: sandbox });
      await store.dispatch(fetchSettings() as any);

      // Do NOT await — ChangeFieldValue fires synchronously before the async sandbox call
      void store.dispatch(changeFieldValue('persistOIDCTokens', false) as any);

      expect(selectWillPurgeOIDCTokens(store.getState())).to.be.true;
    });

    it('returns false again if user re-checks persistOIDCTokens', async function () {
      const sandbox = {
        ...preferencesSandbox,
        getSandboxState: sinonSandbox
          .stub()
          .onFirstCall()
          .resolves({
            userPreferences: { persistOIDCTokens: true },
            preferenceStates: {},
            updatedFields: [],
          })
          .resolves({
            userPreferences: { persistOIDCTokens: false },
            preferenceStates: {},
            updatedFields: ['persistOIDCTokens'],
          }),
      };
      const store = configureStore({ preferencesSandbox: sandbox });
      await store.dispatch(fetchSettings() as any);
      await store.dispatch(changeFieldValue('persistOIDCTokens', false) as any);
      expect(selectWillPurgeOIDCTokens(store.getState())).to.be.true;

      // Re-check the box — the sandbox now returns true again
      sandbox.getSandboxState.resolves({
        userPreferences: { persistOIDCTokens: true },
        preferenceStates: {},
        updatedFields: [],
      });
      await store.dispatch(changeFieldValue('persistOIDCTokens', true) as any);
      expect(selectWillPurgeOIDCTokens(store.getState())).to.be.false;
    });
  });
});
