import { mkdtempSync, rmdirSync, existsSync, readFileSync } from 'fs';
import path from 'path';
import os from 'os';
import { UserStorage, StoragePreferences, type User } from './storage';
import { expect } from 'chai';
import type { UserPreferences } from './preferences';

describe('storage', function () {
  let tmpDir: string;
  describe('UserStorage', function () {
    let storedUser: User;
    let userStorage: UserStorage;
    before(async function () {
      tmpDir = mkdtempSync(path.join(os.tmpdir()));
      userStorage = new UserStorage(tmpDir);
      storedUser = await userStorage.getOrCreate('');
    });
    after(function () {
      rmdirSync(tmpDir, { recursive: true });
    });

    it('creates a new user if user does not exist', async function () {
      const nonExistantUserId = '12345678';
      const user = await userStorage.getOrCreate(nonExistantUserId);
      expect(user.id).to.not.equal(nonExistantUserId);
    });

    it('gets an existing user if it exists', async function () {
      const user = await userStorage.getOrCreate(storedUser.id);
      expect(user).to.deep.equal(storedUser);
    });

    it('updates a user', async function () {
      const lastUsed = new Date();
      const updatedUser = await userStorage.updateUser(storedUser.id, {
        lastUsed,
      });

      expect(updatedUser).to.deep.equal({
        ...storedUser,
        lastUsed,
      });
    });
  });

  describe('StoragePreferences', function () {
    const defaultPreferences = {
      showedNetworkOptIn: true,
    } as unknown as UserPreferences;
    beforeEach(function () {
      tmpDir = mkdtempSync(path.join(os.tmpdir()));
    });

    afterEach(function () {
      rmdirSync(tmpDir, { recursive: true });
    });

    it('sets up the storage', async function () {
      // When user starts compass first time, it creates AppPreferences folder with
      // General.json to store default preferences.

      const storage = new StoragePreferences(defaultPreferences, tmpDir);

      const preferencesDir = path.join(tmpDir, 'AppPreferences');
      const preferencesFile = path.join(
        tmpDir,
        'AppPreferences',
        'General.json'
      );

      expect(existsSync(preferencesDir)).to.be.false;
      expect(existsSync(preferencesFile)).to.be.false;

      await storage.setup();

      expect(existsSync(preferencesDir)).to.be.true;
      expect(existsSync(preferencesFile)).to.be.true;
      expect(
        JSON.parse(readFileSync(preferencesFile).toString())
      ).to.deep.equal(defaultPreferences);
    });

    it('updates preferences', async function () {
      const storage = new StoragePreferences(defaultPreferences, tmpDir);
      await storage.setup();

      await storage.updatePreferences({ currentUserId: '123456789' });

      const newPreferences = storage.getPreferences();

      expect(newPreferences).to.deep.equal({
        ...defaultPreferences,
        currentUserId: '123456789',
      });
    });

    it('will strip unknown prefs', async function () {
      const prefsStorage = new StoragePreferences(
        { showedNetworkOptIn: true, foo: true } as unknown as UserPreferences,
        tmpDir
      );
      await prefsStorage.setup();

      // roundabout way to make it load because setup doesn't fill prefsStorage.preferences if it writes the file
      await prefsStorage.updatePreferences({});

      const prefs = prefsStorage.getPreferences();
      expect(prefs).to.deep.equal({ showedNetworkOptIn: true });
    });
  });
});
