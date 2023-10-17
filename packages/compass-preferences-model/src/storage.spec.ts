import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  getDefaultPreferences,
  UserStorage,
  StoragePreferences,
  type User,
} from './storage';
import { expect } from 'chai';
import { z } from '@mongodb-js/compass-user-data';
import { users as UserFixtures } from './../test/fixtures';

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

    it('throws validation errors', async function () {
      {
        try {
          await userStorage.updateUser(storedUser.id, {
            lastUsed: 'something-unacceptable',
          } as any);
          expect.fail('Expected lastUsed prop to fail due to date validation');
        } catch (e) {
          expect(e).to.be.an.instanceOf(z.ZodError);
        }
      }

      {
        try {
          await userStorage.updateUser(storedUser.id, {
            createdAt: 'something-unacceptable',
          } as any);
          expect.fail('Expected createdAt prop to fail due to date validation');
        } catch (e) {
          expect(e).to.be.an.instanceOf(z.ZodError);
        }
      }

      {
        try {
          await userStorage.updateUser(storedUser.id, {
            id: 'something-unacceptable',
          });
          expect.fail('Expected id prop to fail due to uuid validation');
        } catch (e) {
          expect(e).to.be.an.instanceOf(z.ZodError);
        }
      }
    });

    for (const { data: user, version } of UserFixtures) {
      it(`supports user data from Compass v${version}`, async function () {
        const userPath = path.join(tmpDir, 'Users', `${user.id}.json`);
        await fs.writeFile(userPath, JSON.stringify(user));

        const expectedUser = await userStorage.getUser(user.id);

        expect(expectedUser.id).to.equal(user.id);
        expect(expectedUser.createdAt).to.deep.equal(new Date(user.createdAt));
        expect(expectedUser.lastUsed).to.deep.equal(new Date(user.lastUsed));
      });
    }
  });

  describe('StoragePreferences', function () {
    beforeEach(async function () {
      tmpDir = await fs.mkdtemp(path.join(os.tmpdir()));
    });

    afterEach(async function () {
      await fs.rmdir(tmpDir, { recursive: true });
    });

    it('sets up the storage', async function () {
      // When user starts compass first time, it creates AppPreferences folder with
      // General.json to store default preferences.

      const storage = new StoragePreferences(tmpDir);

      const preferencesDir = getPreferencesFolder(tmpDir);
      const preferencesFile = getPreferencesFile(tmpDir);

      expect(async () => await fs.access(preferencesDir)).to.throw;
      expect(async () => await fs.access(preferencesFile)).to.throw;

      await storage.setup();

      expect(async () => await fs.access(preferencesDir)).to.not.throw;
      expect(async () => await fs.access(preferencesFile)).to.not.throw;

      expect(
        JSON.parse((await fs.readFile(preferencesFile)).toString())
      ).to.deep.equal(getDefaultPreferences());
    });

    it('when invalid json is stored, it sets the defaults', async function () {
      const storage = new StoragePreferences(tmpDir);

      const preferencesFile = getPreferencesFile(tmpDir);
      await fs.mkdir(getPreferencesFolder(tmpDir));
      await fs.writeFile(preferencesFile, '{}}', 'utf-8');

      // Ensure it exists
      expect(async () => await fs.access(preferencesFile)).to.not.throw;

      await storage.setup();

      expect(
        JSON.parse((await fs.readFile(preferencesFile)).toString())
      ).to.deep.equal(getDefaultPreferences());
    });

    it('updates preferences', async function () {
      const storage = new StoragePreferences(tmpDir);
      await storage.setup();

      await storage.updatePreferences({ currentUserId: '123456789' });

      const newPreferences = storage.getPreferences();

      expect(newPreferences).to.deep.equal({
        ...getDefaultPreferences(),
        currentUserId: '123456789',
      });
    });

    it('returns default preference values if its not stored on disk', async function () {
      const storage = new StoragePreferences(tmpDir);

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
        ...getDefaultPreferences(),
        currentUserId: '123456789',
      });
    });

    it('does not save random props', async function () {
      const storage = new StoragePreferences(tmpDir);
      await storage.setup();

      await storage.updatePreferences({ someThingNotSupported: 'abc' } as any);

      const newPreferences = storage.getPreferences();

      expect(newPreferences).to.deep.equal(getDefaultPreferences());
    });

    it('strips unknown props when reading from disk', async function () {
      const storage = new StoragePreferences(tmpDir);

      // manually setup the file with default props and unknown prop
      await fs.mkdir(getPreferencesFolder(tmpDir));
      await fs.writeFile(
        getPreferencesFile(tmpDir),
        JSON.stringify({ ...getDefaultPreferences(), somethingUnknown: true }),
        'utf-8'
      );

      await storage.setup();

      expect(storage.getPreferences()).to.deep.equal(getDefaultPreferences());
    });
  });
});
