/* eslint-disable @typescript-eslint/unbound-method */
import { expect } from 'chai';
import Sinon from 'sinon';
import { fetchSettings, changeFieldValue, saveSettings } from './settings';
import { configureStore } from '.';

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
});
