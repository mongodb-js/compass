/* eslint-disable @typescript-eslint/unbound-method */
import { expect } from 'chai';
import sinon from 'sinon';
import type { Actions, State } from './settings';
import {
  reducer,
  INITIAL_STATE,
  fetchSettings,
  changeFieldValue,
  saveSettings,
} from './settings';
import type { PreferencesAccess } from 'compass-preferences-model';
import preferences from 'compass-preferences-model';
import ipc from 'hadron-ipc';

describe('Settings store actions', function () {
  let sinonSandbox: sinon.SinonSandbox;
  let dispatch: sinon.SinonStub;
  let getState: sinon.SinonStub;
  let state: State;

  beforeEach(async function () {
    sinonSandbox = sinon.createSandbox();
    // Replace the global preferences object with a sandbox for each test
    if (ipc.ipcRenderer) {
      sinonSandbox.stub(ipc.ipcRenderer, 'invoke').resolves(undefined);
    }
    const globalPreferencesSandbox = await preferences.createSandbox();
    for (const key of Object.keys(
      globalPreferencesSandbox
    ) as (keyof PreferencesAccess)[]) {
      sinonSandbox
        .stub(preferences, key)
        .callsFake(
          globalPreferencesSandbox[key].bind(globalPreferencesSandbox)
        );
    }

    state = { ...INITIAL_STATE };
    dispatch = sinon
      .stub()
      .callsFake((action: Actions) => (state = reducer(state, action)));
    getState = sinon.stub().callsFake(() => ({ settings: state }));
  });

  afterEach(function () {
    sinonSandbox.restore();
  });

  describe('fetchSettings', function () {
    it('fetches current settings and adds them to the state', async function () {
      expect(state.loadingState).to.equal('loading');
      expect(state.sandbox).to.equal(null);
      await fetchSettings()(dispatch, getState);
      expect(state.loadingState).to.equal('ready');
      expect(state.sandbox?.getPreferences).to.be.a('function');
      expect(state.settings.theme).to.be.a('string');
      expect(state.preferenceStates).to.deep.equal({});
      expect(state.updatedFields).to.deep.equal([]);
    });
  });

  describe('changeFieldValue', function () {
    it('updates the value of a single field', async function () {
      await fetchSettings()(dispatch, getState);
      expect(state.sandbox?.getPreferences().readOnly).to.equal(false);
      expect(state.settings.readOnly).to.equal(false);
      expect(state.settings.enableShell).to.equal(true);
      await changeFieldValue('readOnly', true)(dispatch, getState);
      expect(state.sandbox?.getPreferences().readOnly).to.equal(true);
      expect(state.settings.readOnly).to.equal(true);
      expect(state.settings.enableShell).to.equal(false);
      expect(state.preferenceStates).to.deep.equal({
        enableShell: 'derived',
      });
      expect(state.updatedFields).to.deep.equal(['readOnly']);
    });
  });

  describe('saveSettings', function () {
    it('updates the global preferences struct', async function () {
      await fetchSettings()(dispatch, getState);
      await changeFieldValue('readOnly', true)(dispatch, getState);
      await saveSettings()(dispatch, getState);
      expect(preferences.savePreferences).to.have.been.calledOnceWithExactly({
        readOnly: true,
      });
    });
  });
});
