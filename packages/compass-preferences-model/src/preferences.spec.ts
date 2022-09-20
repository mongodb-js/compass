import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import Preferences from './preferences';
import { expect } from 'chai';

describe('Preferences class', function () {
  let tmpdir: string;
  let i = 0;

  beforeEach(async function () {
    tmpdir = path.join(os.tmpdir(), `preferences-test-${Date.now()}-${i++}`);
    await fs.mkdir(tmpdir, { recursive: true });
  });

  after(async function () {
    await fs.rm(tmpdir, { recursive: true });
  });

  it('allows providing default preferences', async function () {
    const preferences = new Preferences(tmpdir);
    const result = await preferences.fetchPreferences();
    expect(result.id).to.equal('General');
    expect(result.enableMaps).to.equal(false);
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

  it('notifies callers of preferences changes', async function () {
    const preferences = new Preferences(tmpdir);
    const calls: any[] = [];
    preferences.onPreferencesChanged((prefs) => calls.push(prefs));
    await preferences.savePreferences({ enableMaps: true });
    expect(calls).to.deep.equal([{ enableMaps: true }]);
  });

  it('can return user-configurable preferences after setting their defaults', async function () {
    const preferences = new Preferences(tmpdir);
    const result = await preferences.getConfigurableUserPreferences();
    expect(result).not.to.have.property('id');
    expect(result.enableMaps).to.equal(true);
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
});
