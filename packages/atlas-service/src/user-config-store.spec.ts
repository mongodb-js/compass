import Sinon from 'sinon';
import { AtlasUserConfigStore } from './user-config-store';
import { expect } from 'chai';

describe('AtlasUserConfigStore', function () {
  const sandbox = Sinon.createSandbox();

  beforeEach(function () {
    sandbox.reset();
    new AtlasUserConfigStore().clearCache();
  });

  describe('getUserConfig', function () {
    it('should throw if config shape is unexpected', async function () {
      const store = new AtlasUserConfigStore({
        readFile: sandbox
          .stub()
          .onFirstCall()
          .resolves('"meow"')
          .onSecondCall()
          .resolves('{"enabledAIFeature": "yes, totally"}'),
      } as any);

      store['getConfigDir'] = () => '/tmp';

      try {
        await store.getUserConfig('1234');
        expect.fail('Expected getUserConfig to throw');
      } catch (err) {
        expect(err)
          .to.have.property('message')
          .match(/Expected AtlasUserConfig to be an object/);
      }

      try {
        await store.getUserConfig('1234');
        expect.fail('Expected getUserConfig to throw');
      } catch (err) {
        expect(err)
          .to.have.property('message')
          .match(/Unexpected values in AtlasUserConfig/);
      }
    });

    it('should throw if reading file failed for any reason other than file not existing', async function () {
      const err = new Error('EACCESS');
      (err as any).code = 'EACCESS';

      const store = new AtlasUserConfigStore({
        readFile: sandbox.stub().rejects(err),
      } as any);

      store['getConfigDir'] = () => '/tmp';

      try {
        await store.getUserConfig('1234');
        expect.fail('Expected getUserConfig to throw');
      } catch (err) {
        expect(err)
          .to.have.property('message')
          .match(/EACCESS/);
      }
    });

    it("should return default user config if config file doesn't exist", async function () {
      const err = new Error('ENOENT');
      (err as any).code = 'ENOENT';

      const store = new AtlasUserConfigStore({
        readFile: sandbox.stub().rejects(err),
      } as any);

      store['getConfigDir'] = () => '/tmp';

      expect(await store.getUserConfig('1234')).to.deep.eq({
        enabledAIFeature: false,
      });
    });

    it('should return default user config if config file is missing required keys', async function () {
      const store = new AtlasUserConfigStore({
        readFile: sandbox.stub().resolves('{}'),
      } as any);

      store['getConfigDir'] = () => '/tmp';

      expect(await store.getUserConfig('1234')).to.deep.eq({
        enabledAIFeature: false,
      });
    });

    it('should return config if it exists', async function () {
      const store = new AtlasUserConfigStore({
        readFile: sandbox.stub().resolves('{"enabledAIFeature": true}'),
      } as any);

      store['getConfigDir'] = () => '/tmp';

      expect(await store.getUserConfig('1234')).to.deep.eq({
        enabledAIFeature: true,
      });
    });

    it('should return config from in-memory cache after first read', async function () {
      const mockFs = {
        readFile: sandbox.stub().resolves('{"enabledAIFeature": true}'),
      };
      const store = new AtlasUserConfigStore(mockFs as any);

      store['getConfigDir'] = () => '/tmp';

      expect(await store.getUserConfig('1234')).to.deep.eq({
        enabledAIFeature: true,
      });

      expect(await store.getUserConfig('1234')).to.deep.eq({
        enabledAIFeature: true,
      });

      expect(mockFs.readFile).to.have.been.calledOnce;
    });
  });

  describe('updateUserConfig', function () {
    it('should update user config value in in-memory cache', async function () {
      const mockFs = {
        readFile: sandbox.stub().resolves('{"enabledAIFeature": true}'),
        writeFile: sandbox.stub().resolves(),
        mkdir: sandbox.stub().resolves(),
      };

      const store = new AtlasUserConfigStore(mockFs);

      store['getConfigDir'] = () => '/tmp';

      await store.updateUserConfig('1234', { enabledAIFeature: true });
      expect(await store.getUserConfig('1234')).to.deep.eq({
        enabledAIFeature: true,
      });

      expect(mockFs.readFile).to.have.been.calledOnce;
      expect(mockFs.writeFile).to.have.been.calledOnce;
    });
  });
});
