import Sinon from 'sinon';
import { PreferencesSandbox } from './preferences-sandbox';
import preferences from 'compass-preferences-model';
import { expect } from 'chai';

describe('PreferencesSandbox', function () {
  const sinonSandbox = Sinon.createSandbox();

  let preferencesAccess: Sinon.SinonSpiedInstance<typeof preferences>;

  beforeEach(async function () {
    preferencesAccess = sinonSandbox.spy(await preferences.createSandbox());
  });

  afterEach(function () {
    sinonSandbox.reset();
  });

  describe('setupSandbox', function () {
    it('should create a sandbox', async function () {
      const preferencesSandbox = new PreferencesSandbox(preferencesAccess);
      expect(() => preferencesSandbox['sandbox']).to.throw;
      await preferencesSandbox.setupSandbox();
      expect(preferencesSandbox['sandbox']).to.not.eq(null);
    });
  });

  describe('updateField', function () {
    it('should update field in sandbox preferences, but not in global one', async function () {
      const preferencesSandbox = new PreferencesSandbox(preferencesAccess);
      await preferencesSandbox.setupSandbox();

      expect(
        await preferencesSandbox.getSandboxState()
      ).to.have.nested.property('userPreferences.theme', 'LIGHT');

      await preferencesSandbox.updateField('theme', 'DARK');

      expect(
        await preferencesSandbox.getSandboxState()
      ).to.have.nested.property('userPreferences.theme', 'DARK');
      expect(preferencesAccess.getPreferences()).to.have.property(
        'theme',
        'LIGHT'
      );
    });
  });

  describe('getSandboxState', function () {
    it('should return current sandbox state', async function () {
      const preferencesSandbox = new PreferencesSandbox(preferencesAccess);
      await preferencesSandbox.setupSandbox();

      const state1 = await preferencesSandbox.getSandboxState();

      expect(state1).to.have.nested.property('userPreferences.theme', 'LIGHT');
      expect(state1).to.have.property('updatedFields').deep.eq([]);

      await preferencesSandbox.updateField('theme', 'DARK');

      const state2 = await preferencesSandbox.getSandboxState();

      expect(state2).to.have.nested.property('userPreferences.theme', 'DARK');
      expect(state2).to.have.property('updatedFields').deep.eq(['theme']);
    });
  });

  describe('applySandboxChangesToPreferences', function () {
    it('should sync sandbox preferences back to the global ones', async function () {
      const preferencesSandbox = new PreferencesSandbox(preferencesAccess);
      await preferencesSandbox.setupSandbox();

      await preferencesSandbox.updateField('theme', 'DARK');
      await preferencesSandbox.applySandboxChangesToPreferences();

      expect(
        await preferencesSandbox.getSandboxState()
      ).to.have.nested.property('userPreferences.theme', 'DARK');
      expect(preferencesAccess.getPreferences()).to.have.property(
        'theme',
        'DARK'
      );
    });
  });
});
