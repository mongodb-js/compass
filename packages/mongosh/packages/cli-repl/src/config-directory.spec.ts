import { ConfigManager, ShellHomeDirectory } from './config-directory';
import rimraf from 'rimraf';
import path from 'path';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import chai, { expect } from 'chai';
import sinon from 'ts-sinon';
import sinonChai from 'sinon-chai';
chai.use(sinonChai);

class ExampleConfig {
  someProperty = 42;
}

describe('home directory management', () => {
  let onError: Function;
  let onUpdateConfig: Function;
  let onNewConfig: Function;
  let base: string;
  let shellHomeDirectory: ShellHomeDirectory;
  let manager: ConfigManager<ExampleConfig>;

  beforeEach(() => {
    base = path.resolve(__dirname, '..', '..', '..', 'tmp', 'test', `${Date.now()}`, `${Math.random()}`);
    shellHomeDirectory = new ShellHomeDirectory({
      shellRoamingDataPath: base,
      shellLocalDataPath: base,
      shellRcPath: base
    });
    manager = new ConfigManager(shellHomeDirectory);
    manager.on('error', onError = sinon.spy());
    manager.on('new-config', onNewConfig = sinon.spy());
    manager.on('update-config', onUpdateConfig = sinon.spy());
  });

  afterEach(async() => {
    await promisify(rimraf)(path.resolve(base, '..'));
  });

  describe('ShellHomeDirectory', () => {
    it('creates the directory when asked to do so', async() => {
      let threw = true;
      try {
        await fs.access(base);
        threw = false;
      } catch (err) {
        expect(err.code).to.equal('ENOENT');
      }
      expect(threw).to.be.true;
      await shellHomeDirectory.ensureExists();
      await fs.access(base);
    });

    it('provides a way to access subpaths', async() => {
      const subpath = shellHomeDirectory.localPath('banana');
      expect(subpath).to.equal(path.join(base, 'banana'));
    });
  });

  describe('ConfigManager', () => {
    it('allows storing configs', async() => {
      const configPath = manager.path();
      await manager.writeConfigFile(new ExampleConfig());
      const contents = await fs.readFile(configPath, { encoding: 'utf8' });
      expect(JSON.parse(contents)).to.deep.equal(new ExampleConfig());

      expect(onError).to.not.have.been.called;
      expect(onNewConfig).to.not.have.been.called;
      expect(onUpdateConfig).to.not.have.been.called;
    });

    it('passes on errors storing configs', async() => {
      const configPath = manager.path();
      await shellHomeDirectory.ensureExists();
      // Oops, we already create a 'config' directory rather than a file...
      await fs.mkdir(configPath);

      let threw = true;
      try {
        await manager.writeConfigFile(new ExampleConfig());
        threw = false;
      } catch (err) {
        expect(err.code).to.equal('EISDIR');
      }
      expect(threw).to.be.true;

      expect(onError).to.have.been.called;
      expect(onNewConfig).to.not.have.been.called;
      expect(onUpdateConfig).to.not.have.been.called;
    });

    it('allows specifying a default config if none exists yet', async() => {
      const configPath = manager.path();
      await shellHomeDirectory.ensureExists();

      let config = await manager.generateOrReadConfig({ someProperty: 0 });
      expect(config.someProperty).to.equal(0);
      expect(onError).to.not.have.been.called;
      expect(onNewConfig).to.have.been.calledOnce;
      expect(onUpdateConfig).to.not.have.been.called;

      config = await manager.generateOrReadConfig({ someProperty: 1 });
      expect(config.someProperty).to.equal(0);
      expect(onError).to.not.have.been.called;
      expect(onNewConfig).to.have.been.calledOnce;
      expect(onUpdateConfig).to.have.been.calledOnce;

      // Store garbage in the file and watch for the error.
      await fs.writeFile(configPath, 'notjson');
      config = await manager.generateOrReadConfig({ someProperty: 2 });
      expect(config.someProperty).to.equal(2);
      expect(onError).to.have.been.calledOnce;
      expect(onNewConfig).to.have.been.calledOnce;
      expect(onUpdateConfig).to.have.been.calledOnce;

      if (process.platform !== 'win32') {
        // Revoke all permissions from the config file and watch for the error.
        await fs.chmod(configPath, 0);
        let threw = true;
        try {
          await manager.generateOrReadConfig({ someProperty: 3 });
          threw = false;
        } catch (err) {
          expect(err.code).to.be.oneOf(['EPERM', 'EACCES']);
        }
        expect(threw).to.be.true;
        expect(onError).to.have.been.calledTwice;
        expect(onNewConfig).to.have.been.calledOnce;
        expect(onUpdateConfig).to.have.been.calledOnce;
      }
    });
  });
});
