import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { Preferences } from './preferences';
import { expect } from 'chai';
import { featureFlags } from './feature-flags';

const releasedFeatureFlags = Object.entries(featureFlags)
  .filter(([, v]) => v.stage === 'released')
  .map(([k]) => k);

const expectedReleasedFeatureFlagsStates = Object.fromEntries(
  releasedFeatureFlags.map((ff) => [ff, 'hardcoded'])
);

const setupPreferences = async (
  ...args: ConstructorParameters<typeof Preferences>
) => {
  const preferences = new Preferences(...args);
  await preferences.setupStorage();
  return preferences;
};

describe('Preferences class', function () {
  let tmpdir: string;
  let i = 0;

  beforeEach(async function () {
    tmpdir = path.join(os.tmpdir(), `preferences-test-${Date.now()}-${i++}`);
    await fs.mkdir(tmpdir, { recursive: true });
  });

  afterEach(async function () {
    await fs.rm(tmpdir, { recursive: true });
  });

  it('allows providing default preferences', async function () {
    const preferences = await setupPreferences(tmpdir);
    const result = preferences.getPreferences();
    expect(result.id).to.equal('General');
    expect(result.enableMaps).to.equal(false);
    expect(result.enableShell).to.equal(true);
  });

  it('allows saving preferences', async function () {
    const preferences = await setupPreferences(tmpdir);
    await preferences.savePreferences({ enableMaps: true });
    const result = preferences.getPreferences();
    expect(result.id).to.equal('General');
    expect(result.enableMaps).to.equal(true);
  });

  it('will strip unknown saved preferences', async function () {
    const preferences = await setupPreferences(tmpdir);
    // Save any unknown preference. We validate everything in preferences class
    // and do not validate anything in storage. As we are calling updatePreferences
    // directly here, it should save this unknown prop.
    await (preferences as any)._preferencesStorage.updatePreferences({
      something: '1234',
    });

    const userPrefs = preferences.getPreferences();
    expect(userPrefs).to.not.have.property('something');
  });

  it('throws when saving invalid data', async function () {
    const preferences = await setupPreferences(tmpdir);
    expect(
      async () =>
        await preferences.savePreferences({
          telemetryAnonymousId: 'not-a-uuid',
        })
    ).to.throw;
  });

  it('stores preferences across instances', async function () {
    const preferences1 = await setupPreferences(tmpdir);
    await preferences1.savePreferences({ enableMaps: true });
    const preferences2 = await setupPreferences(tmpdir);
    const result = preferences2.getPreferences();
    expect(result.id).to.equal('General');
    expect(result.enableMaps).to.equal(true);
  });

  it('notifies callers of preferences changes after savePreferences', async function () {
    const preferences = await setupPreferences(tmpdir);
    const calls: any[] = [];
    preferences.onPreferencesChanged((prefs) => calls.push(prefs));
    await preferences.savePreferences({ enableMaps: true });
    expect(calls).to.deep.equal([{ enableMaps: true }]);
  });

  it('can return user-configurable preferences after setting their defaults', async function () {
    const preferences = await setupPreferences(tmpdir);
    await preferences.ensureDefaultConfigurableUserPreferences();
    const result = preferences.getConfigurableUserPreferences();
    expect(result).not.to.have.property('id');
    expect(result.enableMaps).to.equal(true);
    expect(result.enableShell).to.equal(true);
  });

  it('allows providing cli- and global-config-provided options', async function () {
    const preferences = await setupPreferences(tmpdir, {
      cli: {
        enableMaps: false,
        trackUsageStatistics: true,
      },
      global: {
        trackUsageStatistics: false,
      },
    });
    await preferences.ensureDefaultConfigurableUserPreferences();
    const result = preferences.getConfigurableUserPreferences();
    expect(result).not.to.have.property('id');
    expect(result.autoUpdates).to.equal(true);
    expect(result.enableMaps).to.equal(false);
    expect(result.trackUsageStatistics).to.equal(false); // global takes precedence over cli

    const states = preferences.getPreferenceStates();
    expect(states).to.deep.equal({
      trackUsageStatistics: 'set-global',
      enableMaps: 'set-cli',
      ...expectedReleasedFeatureFlagsStates,
    });
  });

  it('allows providing true options that influence the values of other options', async function () {
    const preferences = await setupPreferences(tmpdir, {
      cli: {
        enableMaps: true,
        enableShell: true,
      },
      global: {
        trackUsageStatistics: true,
        networkTraffic: false,
        readOnly: true,
      },
    });
    const result = preferences.getPreferences();
    expect(result.autoUpdates).to.equal(false);
    expect(result.enableMaps).to.equal(false);
    expect(result.trackUsageStatistics).to.equal(false);
    expect(result.networkTraffic).to.equal(false);
    expect(result.readOnly).to.equal(true);
    expect(result.enableShell).to.equal(false);

    const states = preferences.getPreferenceStates();
    expect(states).to.deep.equal({
      enableFeedbackPanel: 'set-global',
      autoUpdates: 'set-global',
      enableDevTools: 'set-global',
      networkTraffic: 'set-global',
      trackUsageStatistics: 'set-global',
      enableGenAIFeatures: 'set-global',
      enableMaps: 'set-cli',
      enableShell: 'set-cli',
      readOnly: 'set-global',
      ...expectedReleasedFeatureFlagsStates,
    });
  });

  it('allows providing false options that should not influence the values of other options', async function () {
    const preferences = await setupPreferences(tmpdir, {
      global: {
        readOnly: false,
      },
    });
    const result = preferences.getPreferences();
    expect(result.readOnly).to.equal(false);
    expect(result.enableShell).to.equal(true);

    const states = preferences.getPreferenceStates();

    expect(states).to.deep.equal({
      readOnly: 'set-global',
      ...expectedReleasedFeatureFlagsStates,
    });
  });

  it('accounts for derived preference values in save calls', async function () {
    const preferences = await setupPreferences(tmpdir, {
      global: {
        networkTraffic: false,
      },
    });
    const calls: any[] = [];
    preferences.onPreferencesChanged((prefs) => calls.push(prefs));

    const fetchResult = preferences.getPreferences();
    expect(fetchResult.autoUpdates).to.equal(false);
    const saveResult = await preferences.savePreferences({ autoUpdates: true });
    expect(saveResult.autoUpdates).to.equal(false); // (!)
    expect(calls).to.have.lengthOf(0); // no updates, networkTraffic overrides change

    const preferences2 = await setupPreferences(tmpdir);
    const fetchResult2 = preferences2.getPreferences();
    expect(fetchResult2.autoUpdates).to.equal(true); // (!)
  });

  it('includes changes to derived preference values in change listeners', async function () {
    const preferences = await setupPreferences(tmpdir);
    const calls: any[] = [];
    preferences.onPreferencesChanged((prefs) => calls.push(prefs));
    await preferences.ensureDefaultConfigurableUserPreferences();
    preferences.getConfigurableUserPreferences(); // set defaults
    await preferences.savePreferences({ networkTraffic: false });
    await preferences.savePreferences({ readOnly: true });
    expect(calls).to.deep.equal([
      {
        showedNetworkOptIn: true,
        enableMaps: true,
        enableFeedbackPanel: true,
        trackUsageStatistics: true,
        autoUpdates: true,
      },
      {
        networkTraffic: false,
        enableGenAIFeatures: false,
        enableMaps: false,
        enableFeedbackPanel: false,
        trackUsageStatistics: false,
        autoUpdates: false,
      },
      {
        readOnly: true,
        enableShell: false,
      },
    ]);
  });

  it('allows hardcoding some options and derive other option values based on that', async function () {
    const preferences = await setupPreferences(tmpdir, {
      cli: {
        enableMaps: true,
      },
      global: {
        enableDevTools: true,
      },
      hardcoded: {
        networkTraffic: false,
      },
    });
    const result = preferences.getPreferences();
    expect(result.autoUpdates).to.equal(false);
    expect(result.enableMaps).to.equal(false);
    expect(result.enableDevTools).to.equal(true);
    expect(result.networkTraffic).to.equal(false);

    const states = preferences.getPreferenceStates();
    expect(states).to.deep.equal({
      enableGenAIFeatures: 'hardcoded',
      enableDevTools: 'set-global',
      enableMaps: 'set-cli',
      enableFeedbackPanel: 'hardcoded',
      autoUpdates: 'hardcoded',
      networkTraffic: 'hardcoded',
      trackUsageStatistics: 'hardcoded',
      ...expectedReleasedFeatureFlagsStates,
    });
  });

  it('can create sandbox preferences instances that do not affect the main preference instance', async function () {
    const mainPreferences = await setupPreferences(tmpdir, {
      cli: {
        enableMaps: true,
      },
      global: {
        trackUsageStatistics: true,
      },
    });
    await mainPreferences.savePreferences({ trackUsageStatistics: true });
    const sandbox = await Preferences.CreateSandbox(
      await mainPreferences.getPreferenceSandboxProperties()
    );

    await sandbox.savePreferences({ readOnly: true });
    expect(sandbox.getPreferences().readOnly).to.equal(true);
    expect(mainPreferences.getPreferences().readOnly).to.equal(false);

    const mainPreferencesStates = mainPreferences.getPreferenceStates();

    expect(mainPreferencesStates).to.deep.equal({
      trackUsageStatistics: 'set-global',
      enableMaps: 'set-cli',
      ...expectedReleasedFeatureFlagsStates,
    });

    const sandboxPreferencesStates = sandbox.getPreferenceStates();
    expect(sandboxPreferencesStates).to.deep.equal({
      enableDevTools: 'derived',
      trackUsageStatistics: 'set-global',
      enableMaps: 'set-cli',
      enableShell: 'derived',
      ...expectedReleasedFeatureFlagsStates,
    });
  });
});
