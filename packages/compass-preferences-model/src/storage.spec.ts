import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { UserStorage, StoragePreferences, type User } from './storage';
import { expect } from 'chai';
import type { UserPreferences } from './preferences';

const getPreferencesFolder = (tmpDir: string) => {
  return path.join(tmpDir, 'AppPreferences');
};

const getPreferencesFile = (tmpDir: string) => {
  return path.join(getPreferencesFolder(tmpDir), 'General.json');
};

describe('storage', function () {
  let tmpDir: string;
  describe('UserStorage', function () {
    let storedUser: User;
    let userStorage: UserStorage;
    before(async function () {
      tmpDir = await fs.mkdtemp(path.join(os.tmpdir()));
      userStorage = new UserStorage(tmpDir);
      storedUser = await userStorage.getOrCreate('');
    });
    after(async function () {
      await fs.rmdir(tmpDir, { recursive: true });
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
    beforeEach(async function () {
      tmpDir = await fs.mkdtemp(path.join(os.tmpdir()));
    });

    afterEach(async function () {
      await fs.rmdir(tmpDir, { recursive: true });
    });

    it('sets up the storage', async function () {
      // When user starts compass first time, it creates AppPreferences folder with
      // General.json to store default preferences.

      const storage = new StoragePreferences(defaultPreferences, tmpDir);

      const preferencesDir = getPreferencesFolder(tmpDir);
      const preferencesFile = getPreferencesFile(tmpDir);

      expect(async () => await fs.access(preferencesDir)).to.throw;
      expect(async () => await fs.access(preferencesFile)).to.throw;

      await storage.setup();

      expect(async () => await fs.access(preferencesDir)).to.not.throw;
      expect(async () => await fs.access(preferencesFile)).to.not.throw;

      expect(
        JSON.parse((await fs.readFile(preferencesFile)).toString())
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

    it('returns default preference values if its not stored on disk', async function () {
      const storage = new StoragePreferences(defaultPreferences, tmpDir);

      // manually setup the file with no content
      await fs.mkdir(getPreferencesFolder(tmpDir));
      await fs.writeFile(
        getPreferencesFile(tmpDir),
        JSON.stringify({}),
        'utf-8'
      );

      await storage.updatePreferences({
        currentUserId: '123456789',
      });

      expect(storage.getPreferences()).to.deep.equal({
        ...defaultPreferences,
        currentUserId: '123456789',
      });
    });
  });
});
