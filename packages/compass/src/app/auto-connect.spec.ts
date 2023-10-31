import { expect } from 'chai';
import sinon from 'sinon';
import { loadAutoConnectInfo } from './auto-connect';
import {
  ConnectionStorage,
  type ExportConnectionOptions,
} from '@mongodb-js/connection-storage/main';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/renderer';
import { ipcRenderer } from 'hadron-ipc';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const loadAutoConnectWithConnection = async (
  connectPreferences: Record<string, unknown> = {},
  connections: ConnectionInfo[] = [],
  exportOptions: ExportConnectionOptions = {}
) => {
  const tmpDir = await fs.mkdtemp(
    path.join(os.tmpdir(), 'connection-storage-tests')
  );
  const ipcMain = ConnectionStorage['ipcMain'];

  try {
    await fs.mkdir(path.join(tmpDir, 'Connections'));

    ConnectionStorage['ipcMain'] = { createHandle: sinon.stub() };
    ConnectionStorage.init(tmpDir);
    await Promise.all(
      connections.map((connectionInfo) =>
        ConnectionStorage.save({ connectionInfo })
      )
    );

    const fileContents = await ConnectionStorage.exportConnections({
      options: exportOptions,
    });

    const fakeFs = { readFile: sinon.stub().resolves(fileContents) };
    const deserializeConnections =
      ConnectionStorage.deserializeConnections.bind(ConnectionStorage);

    const fn = await loadAutoConnectInfo(
      sinon.stub().resolves(connectPreferences),
      fakeFs,
      deserializeConnections
    );
    return fn;
  } finally {
    ConnectionStorage['calledOnce'] = false;
    ConnectionStorage['ipcMain'] = ipcMain;
    void fs.rmdir(tmpDir, { recursive: true });
  }
};

describe('auto connection argument parsing', function () {
  let sandbox: sinon.SinonSandbox;
  const initialKeytarEnvValue = process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    sandbox.stub(ipcRenderer!, 'call').resolves(true);
    process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE = 'true';
  });

  afterEach(function () {
    sandbox.restore();
    if (initialKeytarEnvValue) {
      process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE = initialKeytarEnvValue;
    } else {
      delete process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE;
    }
  });

  it('skips connecting if shouldAutoConnect is false', async function () {
    const fn = await loadAutoConnectInfo(
      sandbox.stub().resolves({ shouldAutoConnect: false })
    );
    expect(fn).to.equal(undefined);
  });

  it('understands a connection string if one has been passed', async function () {
    const connectionString = 'mongodb://localhost/';
    const fn = await loadAutoConnectInfo(
      sandbox.stub().resolves({
        shouldAutoConnect: true,
        positionalArguments: [connectionString],
      })
    );
    const info = await fn?.();
    expect(info?.id).to.be.a('string');
    expect(info?.connectionOptions).to.deep.equal({
      connectionString,
    });
  });

  it('reads a single-connection file if one has been specified', async function () {
    const connectionInfo: ConnectionInfo = {
      id: 'e53a561c-142f-403e-9c2e-d591e58cf44b',
      connectionOptions: {
        connectionString: 'mongodb://localhost/',
      },
      favorite: { name: 'foo' },
    };
    const fn = await loadAutoConnectWithConnection(
      { shouldAutoConnect: true, file: 'filename' },
      [connectionInfo]
    );
    const info = await fn?.();
    expect(info).to.deep.equal(connectionInfo);
  });

  it('rejects a multi-conection file if one has been specified without an id', async function () {
    const connectionInfo: Omit<ConnectionInfo, 'id'> = {
      connectionOptions: {
        connectionString: 'mongodb://localhost/',
      },
      favorite: { name: 'foo' },
    };
    const fn = await loadAutoConnectWithConnection(
      { shouldAutoConnect: true, file: 'filename' },
      [
        { ...connectionInfo, id: 'b4148ca4-a8e2-42c8-a838-9890169f7e7d' },
        { ...connectionInfo, id: '9036dd5f-719b-46d1-b812-7e6348e1e9c9' },
      ]
    );
    try {
      await fn?.();
      expect.fail('missed exception');
    } catch (err: any) {
      expect(err.message).to.equal(
        "No connection id specified and connection file 'filename' contained 2 entries"
      );
    }
  });

  it('rejects a multi-conection file if one has been specified with an invalid id', async function () {
    const connectionInfo: Omit<ConnectionInfo, 'id'> = {
      connectionOptions: {
        connectionString: 'mongodb://localhost/',
      },
      favorite: { name: 'foo' },
    };
    const fn = await loadAutoConnectWithConnection(
      {
        shouldAutoConnect: true,
        file: 'filename',
        positionalArguments: ['0000000-0000-0000-0000-000000000000'],
      },
      [
        { ...connectionInfo, id: 'b4148ca4-a8e2-42c8-a838-9890169f7e7d' },
        { ...connectionInfo, id: '9036dd5f-719b-46d1-b812-7e6348e1e9c9' },
      ]
    );
    try {
      await fn?.();
      expect.fail('missed exception');
    } catch (err: any) {
      expect(err.message).to.equal(
        "Could not find connection with id '0000000-0000-0000-0000-000000000000' in connection file 'filename'"
      );
    }
  });

  it('accepts a multi-conection file if an id has been specified', async function () {
    const connectionInfo: Omit<ConnectionInfo, 'id'> = {
      connectionOptions: {
        connectionString: 'mongodb://localhost/',
      },
      favorite: { name: 'foo' },
    };
    const fn = await loadAutoConnectWithConnection(
      {
        shouldAutoConnect: true,
        file: 'filename',
        positionalArguments: ['9036dd5f-719b-46d1-b812-7e6348e1e9c9'],
      },
      [
        { ...connectionInfo, id: 'b4148ca4-a8e2-42c8-a838-9890169f7e7d' },
        { ...connectionInfo, id: '9036dd5f-719b-46d1-b812-7e6348e1e9c9' },
      ]
    );
    const info = await fn?.();
    expect(info).to.deep.equal({
      ...connectionInfo,
      id: '9036dd5f-719b-46d1-b812-7e6348e1e9c9',
    });
  });

  it('rejects an empty file even if an id has been specified', async function () {
    const fn = await loadAutoConnectWithConnection({
      shouldAutoConnect: true,
      file: 'filename',
    });
    try {
      await fn?.();
      expect.fail('missed exception');
    } catch (err: any) {
      expect(err.message).to.equal(
        "No connection id specified and connection file 'filename' contained 0 entries"
      );
    }
  });

  it('rejects an encrypted input file if no passphrase has been specifeid', async function () {
    const connectionInfo: ConnectionInfo = {
      id: 'e53a561c-142f-403e-9c2e-d591e58cf44b',
      connectionOptions: {
        connectionString: 'mongodb://localhost/',
      },
      favorite: { name: 'foo' },
    };
    const fn = await loadAutoConnectWithConnection(
      { shouldAutoConnect: true, file: 'filename' },
      [connectionInfo],
      { passphrase: 'p4ssw0rd' }
    );
    try {
      await fn?.();
      expect.fail('missed exception');
    } catch (err: any) {
      expect(err.message).to.equal(
        'Input file contains encrypted secrets but no passphrase was provided'
      );
    }
  });

  it('accepts an encrypted input file if an passphrase has been specifeid', async function () {
    const connectionInfo: ConnectionInfo = {
      id: 'e53a561c-142f-403e-9c2e-d591e58cf44b',
      connectionOptions: {
        connectionString: 'mongodb://localhost/',
      },
      favorite: { name: 'foo' },
    };
    const fn = await loadAutoConnectWithConnection(
      {
        shouldAutoConnect: true,
        file: 'filename',
        passphrase: 'p4ssw0rd',
      },
      [connectionInfo]
    );
    const info = await fn?.();
    expect(info).to.deep.equal(connectionInfo);
  });

  it('applies username and password if requested', async function () {
    const connectionString = 'mongodb://localhost/';
    const fn = await loadAutoConnectInfo(
      sandbox.stub().resolves({
        shouldAutoConnect: true,
        positionalArguments: [connectionString],
        username: 'user',
        password: 's€cr!t',
      })
    );
    const info = await fn?.();
    expect(info?.id).to.be.a('string');
    expect(info?.connectionOptions).to.deep.equal({
      connectionString: 'mongodb://user:s%E2%82%ACcr!t@localhost/',
    });
  });
});
