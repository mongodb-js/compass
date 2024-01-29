import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { PersistentStorage } from './preferences-persistent-storage';
import { getDefaultsForStoredPreferences } from './preferences-schema';
import { expect } from 'chai';

const getPreferencesFolder = (tmpDir: string) => {
  return path.join(tmpDir, 'AppPreferences');
};

const getPreferencesFile = (tmpDir: string) => {
  return path.join(getPreferencesFolder(tmpDir), 'General.json');
};

describe('PersistentStorage', function () {
  let tmpDir: string;
  beforeEach(async function () {
    tmpDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'compass-preferences-storage')
    );
  });

  afterEach(async function () {
    await fs.rmdir(tmpDir, { recursive: true });
  });

  it('sets up the storage', async function () {
    // When user starts compass first time, it creates AppPreferences folder with
    // General.json to store default preferences.

    const storage = new PersistentStorage(tmpDir);

    const preferencesDir = getPreferencesFolder(tmpDir);
    const preferencesFile = getPreferencesFile(tmpDir);

    expect(async () => await fs.access(preferencesDir)).to.throw;
    expect(async () => await fs.access(preferencesFile)).to.throw;

    await storage.setup();

    expect(async () => await fs.access(preferencesDir)).to.not.throw;
    expect(async () => await fs.access(preferencesFile)).to.not.throw;

    expect(
      JSON.parse((await fs.readFile(preferencesFile)).toString())
    ).to.deep.equal(getDefaultsForStoredPreferences());
  });

  it('when invalid json is stored, it sets the defaults', async function () {
    const storage = new PersistentStorage(tmpDir);

    const preferencesFile = getPreferencesFile(tmpDir);
    await fs.mkdir(getPreferencesFolder(tmpDir));
    await fs.writeFile(preferencesFile, '{}}', 'utf-8');

    // Ensure it exists
    expect(async () => await fs.access(preferencesFile)).to.not.throw;

    await storage.setup();

    expect(
      JSON.parse((await fs.readFile(preferencesFile)).toString())
    ).to.deep.equal(getDefaultsForStoredPreferences());
  });

  it('updates preferences', async function () {
    const storage = new PersistentStorage(tmpDir);
    await storage.setup();

    await storage.updatePreferences({ currentUserId: '123456789' });

    const newPreferences = storage.getPreferences();

    expect(newPreferences).to.deep.equal({
      ...getDefaultsForStoredPreferences(),
      currentUserId: '123456789',
    });
  });

  it('returns default preference values if its not stored on disk', async function () {
    const storage = new PersistentStorage(tmpDir);

    // manually setup the file with no content
    await fs.mkdir(getPreferencesFolder(tmpDir));
    await fs.writeFile(getPreferencesFile(tmpDir), JSON.stringify({}), 'utf-8');

    await storage.updatePreferences({
      currentUserId: '123456789',
    });

    expect(storage.getPreferences()).to.deep.equal({
      ...getDefaultsForStoredPreferences(),
      currentUserId: '123456789',
    });
  });

  it('does not save random props', async function () {
    const storage = new PersistentStorage(tmpDir);
    await storage.setup();

    await storage.updatePreferences({ someThingNotSupported: 'abc' } as any);

    const newPreferences = storage.getPreferences();

    expect(newPreferences).to.deep.equal(getDefaultsForStoredPreferences());
  });

  it('strips unknown props when reading from disk', async function () {
    const storage = new PersistentStorage(tmpDir);

    // manually setup the file with default props and unknown prop
    await fs.mkdir(getPreferencesFolder(tmpDir));
    await fs.writeFile(
      getPreferencesFile(tmpDir),
      JSON.stringify({
        ...getDefaultsForStoredPreferences(),
        somethingUnknown: true,
      }),
      'utf-8'
    );

    await storage.setup();

    expect(storage.getPreferences()).to.deep.equal(
      getDefaultsForStoredPreferences()
    );
  });
});
