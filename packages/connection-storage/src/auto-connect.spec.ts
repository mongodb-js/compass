import { expect } from 'chai';
import sinon from 'sinon';
import {
  initCompassMainConnectionStorage,
  type ExportConnectionOptions,
  type ConnectionInfo,
} from './main';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import type {
  AutoConnectPreferences,
  ConnectionStorage,
} from './connection-storage';
import { omit } from 'lodash';

let connectionStorage: ReturnType<typeof initCompassMainConnectionStorage>;

const createGetAutoConnectInfoFnWithConnections = async (
  connectPreferences: Record<string, unknown> = {},
  connections: ConnectionInfo[] = [],
  exportOptions: ExportConnectionOptions = {}
): Promise<
  () => ReturnType<Required<ConnectionStorage>['getAutoConnectInfo']>
> => {
  const tmpDir = await fs.mkdtemp(
    path.join(os.tmpdir(), 'connection-storage-tests')
  );
  try {
    await fs.mkdir(path.join(tmpDir, 'Connections'));
    connectionStorage = initCompassMainConnectionStorage(
      tmpDir,
      {
        createHandle: sinon.stub(),
      },
      true
    );
    await Promise.all(
      connections.map((connectionInfo) =>
        connectionStorage.save({ connectionInfo })
      )
    );

    const fileContents = await connectionStorage.exportConnections({
      options: exportOptions,
    });

    const fakeFs = { readFile: sinon.stub().resolves(fileContents) };

    return () => {
      return connectionStorage.getAutoConnectInfo(
        connectPreferences as AutoConnectPreferences,
        fakeFs
      );
    };
  } finally {
    void fs.rmdir(tmpDir, { recursive: true });
  }
};

describe('auto connection argument parsing', function () {
  let sandbox: sinon.SinonSandbox;
  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('skips connecting if shouldAutoConnect is false', async function () {
    const fn = await createGetAutoConnectInfoFnWithConnections({
      shouldAutoConnect: false,
    });
    expect(await fn()).to.equal(undefined);
  });

  it('understands a connection string if one has been passed', async function () {
    const connectionString = 'mongodb://localhost/';
    const fn = await createGetAutoConnectInfoFnWithConnections({
      shouldAutoConnect: true,
      positionalArguments: [connectionString],
    });
    const info = await fn();
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
    const fn = await createGetAutoConnectInfoFnWithConnections(
      { shouldAutoConnect: true, file: 'filename' },
      [connectionInfo]
    );
    const info = await fn?.();
    expect(omit(info, 'savedConnectionType')).to.deep.equal(connectionInfo);
  });

  it('rejects a multi-connection file if one has been specified without an id', async function () {
    const connectionInfo: Omit<ConnectionInfo, 'id'> = {
      connectionOptions: {
        connectionString: 'mongodb://localhost/',
      },
      favorite: { name: 'foo' },
    };
    const fn = await createGetAutoConnectInfoFnWithConnections(
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

  it('rejects a multi-connection file if one has been specified with an invalid id', async function () {
    const connectionInfo: Omit<ConnectionInfo, 'id'> = {
      connectionOptions: {
        connectionString: 'mongodb://localhost/',
      },
      favorite: { name: 'foo' },
    };
    const fn = await createGetAutoConnectInfoFnWithConnections(
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

  it('accepts a multi-connection file if an id has been specified', async function () {
    const connectionInfo: Omit<ConnectionInfo, 'id'> = {
      connectionOptions: {
        connectionString: 'mongodb://localhost/',
      },
      favorite: { name: 'foo' },
    };
    const fn = await createGetAutoConnectInfoFnWithConnections(
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
    expect(omit(info, 'savedConnectionType')).to.deep.equal({
      ...connectionInfo,
      id: '9036dd5f-719b-46d1-b812-7e6348e1e9c9',
    });
  });

  it('rejects an empty file even if an id has been specified', async function () {
    const fn = await createGetAutoConnectInfoFnWithConnections({
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

  it('rejects an encrypted input file if no passphrase has been specified', async function () {
    const connectionInfo: ConnectionInfo = {
      id: 'e53a561c-142f-403e-9c2e-d591e58cf44b',
      connectionOptions: {
        connectionString: 'mongodb://localhost/',
      },
      favorite: { name: 'foo' },
    };
    const fn = await createGetAutoConnectInfoFnWithConnections(
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
    const fn = await createGetAutoConnectInfoFnWithConnections(
      {
        shouldAutoConnect: true,
        file: 'filename',
        passphrase: 'p4ssw0rd',
      },
      [connectionInfo]
    );
    const info = await fn?.();
    expect(omit(info, 'savedConnectionType')).to.deep.equal(connectionInfo);
  });

  it('applies username and password if requested', async function () {
    const connectionString = 'mongodb://localhost/';
    // const deserializeConnectionsImpl = storage.deserializeConnections.bind(storage);
    const fn = await createGetAutoConnectInfoFnWithConnections({
      shouldAutoConnect: true,
      positionalArguments: [connectionString],
      username: 'user',
      password: 's€cr!t',
    });
    const info = await fn?.();
    expect(info?.id).to.be.a('string');
    expect(info?.connectionOptions).to.deep.equal({
      connectionString: 'mongodb://user:s%E2%82%ACcr!t@localhost/',
    });
  });
});
