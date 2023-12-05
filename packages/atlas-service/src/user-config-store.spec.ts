import Sinon from 'sinon';
import os from 'os';
import fs from 'fs/promises';
import path from 'path';
import { AtlasUserConfigStore } from './user-config-store';
import { expect } from 'chai';

describe('AtlasUserConfigStore', function () {
  let tmpDir: string;
  let userConfigStore: AtlasUserConfigStore;

  beforeEach(async function () {
    tmpDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'atlas-user-config-tests')
    );
    await fs.mkdir(path.join(tmpDir, 'AtlasUserConfig'), { recursive: true });
    userConfigStore = new AtlasUserConfigStore(tmpDir);
  });

  afterEach(async function () {
    await fs.rm(tmpDir, { recursive: true });
    userConfigStore.clearCache();
  });

  const createAtlasUserConfig = async (userId: string, data: any) => {
    const filePath = path.join(tmpDir, 'AtlasUserConfig', `${userId}.json`);
    await fs.writeFile(filePath, JSON.stringify(data));
  };

  describe('getUserConfig', function () {
    it('should throw if config shape is unexpected', async function () {
      try {
        await createAtlasUserConfig('1234', 'meow');
        await userConfigStore.getUserConfig('1234');
        expect.fail('Expected getUserConfig to throw');
      } catch (err) {
        expect((err as Error).message).to.match(
          /Expected object, received string/
        );
      }

      try {
        await createAtlasUserConfig('1234', {
          enabledAIFeature: 'yes, totally',
        });
        await userConfigStore.getUserConfig('1234');
        expect.fail('Expected getUserConfig to throw');
      } catch (err) {
        expect((err as Error).message).to.match(
          /Expected boolean, received string/
        );
      }
    });

    it('should throw if reading file failed for any reason other than file not existing', async function () {
      const err = new Error('EACCESS');
      (err as any).code = 'EACCESS';

      const readOneStub = Sinon.stub(
        (userConfigStore as any).userData,
        'readOne'
      );
      readOneStub.throws(err);

      try {
        await userConfigStore.getUserConfig('1234');
        expect.fail('Expected getUserConfig to throw');
      } catch (err) {
        expect(err)
          .to.have.property('message')
          .match(/EACCESS/);
      }
    });

    it("should return default user config if config file doesn't exist", async function () {
      expect(await userConfigStore.getUserConfig('1234')).to.deep.eq({
        enabledAIFeature: false,
      });
    });

    it('should return default user config if config file is missing required keys', async function () {
      await createAtlasUserConfig('1234', {});
      expect(await userConfigStore.getUserConfig('1234')).to.deep.eq({
        enabledAIFeature: false,
      });
    });

    it('should return config if it exists', async function () {
      await createAtlasUserConfig('1234', { enabledAIFeature: true });
      expect(await userConfigStore.getUserConfig('1234')).to.deep.eq({
        enabledAIFeature: true,
      });
    });

    it('should return config from in-memory cache after first read', async function () {
      const readSpy = Sinon.spy((userConfigStore as any).userData, 'readOne');

      await createAtlasUserConfig('1234', { enabledAIFeature: true });
      expect(await userConfigStore.getUserConfig('1234')).to.deep.eq({
        enabledAIFeature: true,
      });

      expect(await userConfigStore.getUserConfig('1234')).to.deep.eq({
        enabledAIFeature: true,
      });

      expect(readSpy).to.have.been.calledOnce;
    });
  });

  describe('updateUserConfig', function () {
    it('should update user config value in in-memory cache', async function () {
      const readSpy = Sinon.spy((userConfigStore as any).userData, 'readOne');
      const updateSpy = Sinon.spy((userConfigStore as any).userData, 'write');

      await createAtlasUserConfig('1234', { enabledAIFeature: false });

      await userConfigStore.updateUserConfig('1234', {
        enabledAIFeature: true,
      });
      expect(await userConfigStore.getUserConfig('1234')).to.deep.eq({
        enabledAIFeature: true,
      });

      expect(readSpy).to.have.been.calledOnce;
      expect(updateSpy).to.have.been.calledOnce;
    });
  });
});
