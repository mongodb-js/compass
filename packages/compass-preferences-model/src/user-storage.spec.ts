import { z } from '@mongodb-js/compass-user-data';
import { expect } from 'chai';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import type { UserStorage, User } from './user-storage';
import { UserStorageImpl } from './user-storage';
import { users as UserFixtures } from '../test/fixtures';

describe('UserStorage', function () {
  let tmpDir: string;
  let storedUser: User;
  let userStorage: UserStorage;
  before(async function () {
    tmpDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'compass-preferences-storage')
    );
    userStorage = new UserStorageImpl(tmpDir);
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
