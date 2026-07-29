import { expect } from 'chai';
import Sinon from 'sinon';
import { CompassWebPreferencesAccess } from './compass-web-preferences-access';
import type { PreferencesStorage } from './preferences-storage';
import { getDefaultsForStoredPreferences } from './preferences-schema';

describe('CompassWebPreferencesAccess', function () {
  afterEach(function () {
    Sinon.restore();
  });

  it('defaults to in-memory storage seeded from the overrides', function () {
    const access = new CompassWebPreferencesAccess({ enableShell: true });

    expect(access.getPreferences().enableShell).to.equal(true);
  });

  it('reads from an injected storage', function () {
    const storage: PreferencesStorage = {
      setup: Sinon.stub().resolves(),
      getPreferences: () => ({
        ...getDefaultsForStoredPreferences(),
        maximumNumberOfActiveConnections: 3,
      }),
      updatePreferences: Sinon.stub().resolves(),
    };

    const access = new CompassWebPreferencesAccess(
      undefined,
      undefined,
      storage
    );

    expect(access.getPreferences().maximumNumberOfActiveConnections).to.equal(
      3
    );
  });

  it('writes through to an injected storage', async function () {
    const updatePreferences = Sinon.stub().resolves(true);
    const preferences = getDefaultsForStoredPreferences();
    const storage: PreferencesStorage = {
      setup: Sinon.stub().resolves(),
      getPreferences: () => preferences,
      updatePreferences,
    };
    const access = new CompassWebPreferencesAccess(
      undefined,
      undefined,
      storage
    );

    await access.savePreferences({ maximumNumberOfActiveConnections: 4 });

    expect(updatePreferences).to.have.been.calledOnceWith({
      maximumNumberOfActiveConnections: 4,
    });
  });

  it('marks cloud-provided preferences as non-editable without changing their value', async function () {
    const storage: PreferencesStorage = {
      setup: Sinon.stub().resolves(),
      getPreferences: () => ({
        ...getDefaultsForStoredPreferences(),
        enableShell: true,
      }),
      updatePreferences: Sinon.stub().resolves(),
    };

    const access = new CompassWebPreferencesAccess(
      undefined,
      { atlasCloudProject: { enableShell: false } },
      storage
    );

    expect(access.getPreferences().enableShell).to.equal(true);
    expect(await access.getPreferenceStates()).to.have.property(
      'enableShell',
      'set-cloud-project'
    );
  });

  it('sandboxes an injected storage into an in-memory copy', async function () {
    const updatePreferences = Sinon.stub().resolves(true);
    const storage: PreferencesStorage = {
      setup: Sinon.stub().resolves(),
      getPreferences: () => ({
        ...getDefaultsForStoredPreferences(),
        maximumNumberOfActiveConnections: 3,
      }),
      updatePreferences,
    };
    const access = new CompassWebPreferencesAccess(
      undefined,
      undefined,
      storage
    );

    const sandbox = await access.createSandbox();
    await sandbox.savePreferences({ maximumNumberOfActiveConnections: 9 });

    expect(sandbox.getPreferences().maximumNumberOfActiveConnections).to.equal(
      9
    );
    expect(updatePreferences).to.not.have.been.called;
    expect(access.getPreferences().maximumNumberOfActiveConnections).to.equal(
      3
    );
  });
});
