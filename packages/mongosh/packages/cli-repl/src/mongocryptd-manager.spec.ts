/* eslint-disable chai-friendly/no-unused-expressions */
import Nanobus from 'nanobus';
import { promises as fs } from 'fs';
import path from 'path';
import { getMongocryptdPaths, MongocryptdManager } from './mongocryptd-manager';
import type { MongoshBus } from '@mongosh/types';
import { ShellHomeDirectory } from './config-directory';
import { startTestServer } from '../../../testing/integration-testing-hooks';
import { eventually } from '../test/helpers';
import { expect } from 'chai';

describe('getMongocryptdPaths', () => {
  it('always includes plain `mongocryptd`', async() => {
    expect(await getMongocryptdPaths()).to.deep.include(['mongocryptd']);
  });
});

describe('MongocryptdManager', () => {
  let basePath: string;
  let bus: MongoshBus;
  let shellHomeDirectory: ShellHomeDirectory;
  let spawnPaths: string[][];
  let manager: MongocryptdManager;
  let events: { event: string, data: any }[];
  const makeManager = () => {
    manager = new MongocryptdManager(spawnPaths, shellHomeDirectory, bus);
    return manager;
  };

  const fakeMongocryptdDir = path.resolve(__dirname, '..', 'test', 'fixtures', 'fake-mongocryptd');

  beforeEach(() => {
    const nanobus = new Nanobus();
    events = [];
    nanobus.on('*', (event, data) => events.push({ event, data }));
    bus = nanobus;

    spawnPaths = [];
    basePath = path.resolve(__dirname, '..', '..', '..', 'tmp', 'test', `${Date.now()}`, `${Math.random()}`);
    shellHomeDirectory = new ShellHomeDirectory({
      shellRoamingDataPath: basePath,
      shellLocalDataPath: basePath,
      shellRcPath: basePath
    });
  });
  afterEach(() => {
    manager?.close();
  });

  it('does a no-op close when not initialized', () => {
    expect(makeManager().close().state).to.equal(null);
  });

  for (const otherMongocryptd of ['none', 'missing', 'broken', 'weirdlog']) {
    for (const version of ['4.2', '4.4']) {
      for (const variant of ['withunix', 'nounix']) {
        // eslint-disable-next-line no-loop-func
        it(`spawns a working mongocryptd (${version}, ${variant}, other mongocryptd: ${otherMongocryptd})`, async() => {
          spawnPaths = [
            [
              process.execPath,
              path.resolve(fakeMongocryptdDir, `working-${version}-${variant}.js`)
            ]
          ];
          if (otherMongocryptd === 'missing') {
            spawnPaths.unshift([ path.resolve(fakeMongocryptdDir, 'nonexistent') ]);
          }
          if (otherMongocryptd === 'broken') {
            spawnPaths.unshift([ process.execPath, path.resolve(fakeMongocryptdDir, 'exit1') ]);
          }
          if (otherMongocryptd === 'weirdlog') {
            spawnPaths.unshift([ process.execPath, path.resolve(fakeMongocryptdDir, 'weirdlog') ]);
          }
          expect(await makeManager().start()).to.deep.equal({
            mongocryptdURI: variant === 'nounix' ?
              'mongodb://localhost:27020' :
              'mongodb://%2Ftmp%2Fmongocryptd.sock',
            mongocryptdBypassSpawn: true
          });

          const tryspawns = events.filter(({ event }) => event === 'mongosh:mongocryptd-tryspawn');
          expect(tryspawns).to.have.lengthOf(otherMongocryptd === 'none' ? 1 : 2);
        });
      }
    }
  }

  it('passes relevant arguments to mongocryptd', async() => {
    spawnPaths = [[process.execPath, path.resolve(fakeMongocryptdDir, 'writepidfile.js')]];
    await makeManager().start();
    const pidfile = path.join(manager.path, 'mongocryptd.pid');
    expect(JSON.parse(await fs.readFile(pidfile, 'utf8')).args).to.deep.equal([
      ...spawnPaths[0],
      '--idleShutdownTimeoutSecs', '60',
      '--pidfilepath', pidfile,
      '--port', '0',
      ...(process.platform !== 'win32' ? ['--unixSocketPrefix', path.dirname(pidfile)] : [])
    ]);
  });

  it('multiple start() calls are no-ops', async() => {
    spawnPaths = [[process.execPath, path.resolve(fakeMongocryptdDir, 'writepidfile.js')]];
    const manager = makeManager();
    await manager.start();
    const pid1 = manager.state.proc.pid;
    await manager.start();
    expect(manager.state.proc.pid).to.equal(pid1);
  });

  it('handles synchronous throws from child_process.spawn', async() => {
    spawnPaths = [['']];
    try {
      await makeManager().start();
      expect.fail('missed exception');
    } catch (e) {
      expect(e.code).to.equal('ERR_INVALID_ARG_VALUE');
    }
  });

  it('throws if no spawn paths are provided at all', async() => {
    spawnPaths = [];
    try {
      await makeManager().start();
      expect.fail('missed exception');
    } catch (e) {
      expect(e.name).to.equal('MongoshInternalError');
    }
  });

  it('includes stderr in the log if stdout is unparseable', async() => {
    spawnPaths = [[process.execPath, path.resolve(fakeMongocryptdDir, 'weirdlog.js')]];
    try {
      await makeManager().start();
      expect.fail('missed exception');
    } catch (e) {
      expect(e.name).to.equal('MongoshInternalError');
    }
    const nostdoutErrors = events.filter(({ event, data }) => {
      return event === 'mongosh:mongocryptd-error' && data.cause === 'nostdout';
    });
    expect(nostdoutErrors).to.deep.equal([{
      event: 'mongosh:mongocryptd-error',
      data: { cause: 'nostdout', stderr: 'Diagnostic message!\n' }
    }]);
  });

  it('cleans up previously created, empty directory entries', async() => {
    spawnPaths = [[process.execPath, path.resolve(fakeMongocryptdDir, 'writepidfile.js')]];

    const manager = makeManager();
    await manager.start();
    const pidfile = path.join(manager.path, 'mongocryptd.pid');
    expect(JSON.parse(await fs.readFile(pidfile, 'utf8')).pid).to.be.a('number');
    manager.close();

    // The file remains after close, but is gone after creating a new one:
    await fs.stat(pidfile);
    await makeManager().start();
    try {
      await fs.stat(pidfile);
      expect.fail('missed exception');
    } catch (e) {
      expect(e.code).to.equal('ENOENT');
    }
  });

  context('with network testing', () => {
    const testServer = startTestServer('shared');

    beforeEach(async() => {
      process.env.MONGOSH_TEST_PROXY_TARGET_PORT = await testServer.port();
    });
    afterEach(() => {
      delete process.env.MONGOSH_TEST_PROXY_TARGET_PORT;
    });

    it('performs keepalive pings', async() => {
      spawnPaths = [[process.execPath, path.resolve(fakeMongocryptdDir, 'withnetworking.js')]];
      const manager = makeManager();
      manager.idleShutdownTimeoutSecs = 1;
      await manager.start();
      const pidfile = path.join(manager.path, 'mongocryptd.pid');
      await eventually(async() => {
        expect(JSON.parse(await fs.readFile(pidfile, 'utf8')).connections).to.be.greaterThan(1);
      });
    });
  });
});
