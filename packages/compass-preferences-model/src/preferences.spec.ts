import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { Preferences } from './preferences';
import { expect } from 'chai';

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
    const preferences = new Preferences(tmpdir);
    const result = await preferences.fetchPreferences();
    expect(result.id).to.equal('General');
    expect(result.enableMaps).to.equal(false);
    expect(result.enableShell).to.equal(true);
  });

  it('allows saving preferences', async function () {
    const preferences = new Preferences(tmpdir);
    await preferences.savePreferences({ enableMaps: true });
    const result = await preferences.fetchPreferences();
    expect(result.id).to.equal('General');
    expect(result.enableMaps).to.equal(true);
  });

  it('forbids saving non-model preferences', async function () {
    const preferences = new Preferences(tmpdir);
    try {
      // @ts-expect-error That this doesn't work is part of the test
      await preferences.savePreferences({ help: true });
      expect.fail('missed exception');
    } catch (err: any) {
      expect(err.message).to.equal(
        'Setting "help" is not part of the preferences model'
      );
    }
  });

  it('stores preferences across instances', async function () {
    const preferences1 = new Preferences(tmpdir);
    await preferences1.savePreferences({ enableMaps: true });
    const preferences2 = new Preferences(tmpdir);
    const result = await preferences2.fetchPreferences();
    expect(result.id).to.equal('General');
    expect(result.enableMaps).to.equal(true);
  });

  it('notifies callers of preferences changes after savePreferences', async function () {
    const preferences = new Preferences(tmpdir);
    const calls: any[] = [];
    preferences.onPreferencesChanged((prefs) => calls.push(prefs));
    await preferences.savePreferences({ enableMaps: true });
    expect(calls).to.deep.equal([{ enableMaps: true }]);
  });

  it('notifies callers of preferences changes after fetchPreferences', async function () {
    const calls: any[] = [];

    const preferences1 = new Preferences(tmpdir);
    preferences1.onPreferencesChanged((prefs) => calls.push(1, prefs));
    await preferences1.fetchPreferences();
    const preferences2 = new Preferences(tmpdir);
    preferences2.onPreferencesChanged((prefs) => calls.push(2, prefs));
    await preferences2.fetchPreferences();

    await preferences1.savePreferences({ enableMaps: true });
    await preferences2.fetchPreferences();

    expect(calls).to.deep.equal([
      1,
      { enableMaps: true },
      2,
      { enableMaps: true },
    ]);
  });

  it('handles concurrent modifications to different preferences', async function () {
    const calls: any[] = [];

    const preferences1 = new Preferences(tmpdir);
    preferences1.onPreferencesChanged((prefs) => calls.push(1, prefs));
    await preferences1.fetchPreferences();
    const preferences2 = new Preferences(tmpdir);
    preferences2.onPreferencesChanged((prefs) => calls.push(2, prefs));
    await preferences2.fetchPreferences();

    await preferences1.savePreferences({ enableMaps: true });
    await preferences2.savePreferences({ autoUpdates: true });
    const result1 = await preferences1.fetchPreferences();
    const result2 = await preferences2.fetchPreferences();
    expect(result1).to.deep.equal(result2);
    expect(result1.enableMaps).to.equal(true);
    expect(result1.autoUpdates).to.equal(true);

    expect(calls).to.deep.equal([
      1,
      { enableMaps: true },
      2,
      { enableMaps: true },
      2,
      { autoUpdates: true },
      1,
      { autoUpdates: true },
    ]);
  });

  it('can return user-configurable preferences after setting their defaults', async function () {
    const preferences = new Preferences(tmpdir);
    await preferences.ensureDefaultConfigurableUserPreferences();
    const result = await preferences.getConfigurableUserPreferences();
    expect(result).not.to.have.property('id');
    expect(result.enableMaps).to.equal(true);
    expect(result.enableShell).to.equal(true);
  });

  it('allows providing cli- and global-config-provided options', async function () {
    const preferences = new Preferences(tmpdir, {
      cli: {
        enableMaps: false,
        trackErrors: true,
      },
      global: {
        trackErrors: false,
      },
    });
    await preferences.ensureDefaultConfigurableUserPreferences();
    const result = await preferences.getConfigurableUserPreferences();
    expect(result).not.to.have.property('id');
    expect(result.autoUpdates).to.equal(true);
    expect(result.enableMaps).to.equal(false);
    expect(result.trackErrors).to.equal(false); // global takes precedence over cli

    const states = preferences.getPreferenceStates();
    expect(states).to.deep.equal({
      trackErrors: 'set-global',
      enableMaps: 'set-cli',
    });
  });

  it('allows providing true options that influence the values of other options', async function () {
    const preferences = new Preferences(tmpdir, {
      cli: {
        enableMaps: true,
        enableShell: true,
      },
      global: {
        trackErrors: true,
        networkTraffic: false,
        readOnly: true,
      },
    });
    const result = await preferences.fetchPreferences();
    expect(result.autoUpdates).to.equal(false);
    expect(result.enableMaps).to.equal(false);
    expect(result.trackErrors).to.equal(false);
    expect(result.networkTraffic).to.equal(false);
    expect(result.readOnly).to.equal(true);
    expect(result.enableShell).to.equal(false);

    const states = preferences.getPreferenceStates();
    expect(states).to.deep.equal({
      trackErrors: 'set-global',
      enableFeedbackPanel: 'set-global',
      autoUpdates: 'set-global',
      enableDevTools: 'set-global',
      networkTraffic: 'set-global',
      trackUsageStatistics: 'set-global',
      enableMaps: 'set-cli',
      enableShell: 'set-cli',
      readOnly: 'set-global',
    });
  });

  it('allows providing false options that should not influence the values of other options', async function () {
    const preferences = new Preferences(tmpdir, {
      global: {
        readOnly: false,
      },
    });
    const result = await preferences.fetchPreferences();
    expect(result.readOnly).to.equal(false);
    expect(result.enableShell).to.equal(true);

    const states = preferences.getPreferenceStates();

    expect(states).to.deep.equal({
      readOnly: 'set-global',
    });
  });

  it('accounts for derived preference values in save calls', async function () {
    const preferences = new Preferences(tmpdir, {
      global: {
        networkTraffic: false,
      },
    });
    const calls: any[] = [];
    preferences.onPreferencesChanged((prefs) => calls.push(prefs));

    const fetchResult = await preferences.fetchPreferences();
    expect(fetchResult.autoUpdates).to.equal(false);
    const saveResult = await preferences.savePreferences({ autoUpdates: true });
    expect(saveResult.autoUpdates).to.equal(false); // (!)
    expect(calls).to.have.lengthOf(0); // no updates, networkTraffic overrides change

    const preferences2 = new Preferences(tmpdir);
    const fetchResult2 = await preferences2.fetchPreferences();
    expect(fetchResult2.autoUpdates).to.equal(true); // (!)
  });

  it('includes changes to derived preference values in change listeners', async function () {
    const preferences = new Preferences(tmpdir);
    const calls: any[] = [];
    preferences.onPreferencesChanged((prefs) => calls.push(prefs));
    await preferences.ensureDefaultConfigurableUserPreferences();
    await preferences.getConfigurableUserPreferences(); // set defaults
    await preferences.savePreferences({ networkTraffic: false });
    await preferences.savePreferences({ readOnly: true });
    expect(calls).to.deep.equal([
      {
        showedNetworkOptIn: true,
        enableMaps: true,
        trackErrors: true,
        enableFeedbackPanel: true,
        trackUsageStatistics: true,
        autoUpdates: true,
      },
      {
        networkTraffic: false,
        enableMaps: false,
        trackErrors: false,
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
    const preferences = new Preferences(tmpdir, {
      cli: {
        enableMaps: true,
      },
      global: {
        trackErrors: true,
      },
      hardcoded: {
        networkTraffic: false,
      },
    });
    const result = await preferences.fetchPreferences();
    expect(result.autoUpdates).to.equal(false);
    expect(result.enableMaps).to.equal(false);
    expect(result.trackErrors).to.equal(false);
    expect(result.networkTraffic).to.equal(false);

    const states = preferences.getPreferenceStates();
    expect(states).to.deep.equal({
      trackErrors: 'set-global',
      enableMaps: 'set-cli',
      enableFeedbackPanel: 'hardcoded',
      autoUpdates: 'hardcoded',
      networkTraffic: 'hardcoded',
      trackUsageStatistics: 'hardcoded',
    });
  });

  it('can create sandbox preferences instances that do not affect the main preference instance', async function () {
    const mainPreferences = new Preferences(tmpdir, {
      cli: {
        enableMaps: true,
      },
      global: {
        trackErrors: true,
      },
    });
    await mainPreferences.savePreferences({ trackUsageStatistics: true });
    const sandbox = await Preferences.CreateSandbox(
      await mainPreferences.getPreferenceSandboxProperties()
    );

    await sandbox.savePreferences({ readOnly: true });
    expect((await sandbox.fetchPreferences()).readOnly).to.equal(true);
    expect((await mainPreferences.fetchPreferences()).readOnly).to.equal(false);

    const mainPreferencesStates = mainPreferences.getPreferenceStates();
    expect(mainPreferencesStates).to.deep.equal({
      trackErrors: 'set-global',
      enableMaps: 'set-cli',
    });

    const sandboxPreferencesStates = sandbox.getPreferenceStates();
    expect(sandboxPreferencesStates).to.deep.equal({
      enableDevTools: 'derived',
      trackErrors: 'set-global',
      enableMaps: 'set-cli',
      enableShell: 'derived',
    });
  });
});
