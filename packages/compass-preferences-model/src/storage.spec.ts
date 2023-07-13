import { mkdtempSync, rmdirSync } from 'fs';
import path from 'path';
import os from 'os';
import { UserStorage, type User } from './storage';
import { expect } from 'chai';

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
});
