import { expect } from 'chai';

import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuid } from 'uuid';
import keytar from 'keytar';

import { ConnectionStorage } from './connection-storage';
import type { ConnectionInfo } from './connection-info';
import { getKeytarServiceName } from './utils';
import Sinon from 'sinon';

function getConnectionFilePath(tmpDir: string, id: string): string {
  const connectionsDir = path.join(tmpDir, 'Connections');
  const filePath = path.join(connectionsDir, `${id}.json`);
  return filePath;
}

function getConnectionInfo(props: Partial<ConnectionInfo> = {}) {
  return {
    id: uuid(),
    connectionOptions: {
      connectionString:
        'mongodb://localhost:27017/?readPreference=primary&ssl=false&directConnection=true',
    },
    ...props,
  };
}

function writeFakeConnection(
  tmpDir: string,
  connection: { connectionInfo: ConnectionInfo }
) {
  const filePath = getConnectionFilePath(tmpDir, connection.connectionInfo.id);
  const connectionsDir = path.dirname(filePath);
  fs.mkdirSync(connectionsDir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(connection));
}

describe('ConnectionStorage', function () {
  let tmpDir: string;
  let connectionStorage: ConnectionStorage;
  beforeEach(function () {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'connection-storage-tests'));
    fs.mkdirSync(path.join(tmpDir, 'Connections'));
    connectionStorage = new ConnectionStorage(tmpDir);
  });

  afterEach(function () {
    fs.rmdirSync(tmpDir, { recursive: true });
    Sinon.restore();
  });

  describe('loadAll', function () {
    it('should load an empty array with no connections', async function () {
      const connections = await connectionStorage.loadAll();
      expect(connections).to.deep.equal([]);
    });

    it('should return an array of saved connections', async function () {
      const connectionInfo = getConnectionInfo({ lastUsed: new Date() });
      writeFakeConnection(tmpDir, { connectionInfo });
      const connections = await connectionStorage.loadAll();
      expect(connections).to.deep.equal([connectionInfo]);
    });

    it('should ignore failures in conversion', async function () {
      // Invalid connection string
      const connectionInfo1 = getConnectionInfo({
        connectionOptions: {
          connectionString: '',
        },
      });
      const connectionInfo2 = getConnectionInfo();
      writeFakeConnection(tmpDir, {
        connectionInfo: connectionInfo1,
      });

      writeFakeConnection(tmpDir, {
        connectionInfo: connectionInfo2,
      });
      const connections = await connectionStorage.loadAll();
      expect(connections).to.deep.equal([connectionInfo2]);
    });

    it('should convert lastUsed', async function () {
      const lastUsed = new Date('2021-10-26T13:51:27.585Z');
      const connectionInfo = getConnectionInfo({ lastUsed });
      writeFakeConnection(tmpDir, {
        connectionInfo,
      });

      const connections = await connectionStorage.loadAll();
      expect(connections[0].lastUsed).to.deep.equal(lastUsed);
    });
  });

  describe('load', function () {
    it('should return undefined if id is undefined', async function () {
      expect(await connectionStorage.load(undefined)).to.be.undefined;
      expect(await connectionStorage.load('')).to.be.undefined;
    });

    it('should return undefined if a connection does not exist', async function () {
      const connection = await connectionStorage.load('note-exis-stin-gone');
      expect(connection).to.be.undefined;
    });

    it('should return an existing connection', async function () {
      const connectionInfo = getConnectionInfo();
      writeFakeConnection(tmpDir, {
        connectionInfo,
      });
      const connection = await connectionStorage.load(connectionInfo.id);
      expect(connection).to.deep.equal(connectionInfo);
    });

    it('should convert lastUsed', async function () {
      const lastUsed = new Date('2021-10-26T13:51:27.585Z');
      const connectionInfo = getConnectionInfo({
        lastUsed,
      });
      writeFakeConnection(tmpDir, { connectionInfo });

      const connection = await connectionStorage.load(connectionInfo.id);
      expect(connection!.lastUsed).to.deep.equal(lastUsed);
    });
  });

  describe('save', function () {
    it('saves a valid connection object', async function () {
      const id: string = uuid();
      expect(fs.existsSync(getConnectionFilePath(tmpDir, id))).to.be.false;

      const setPasswordSpy = Sinon.spy(keytar, 'setPassword');

      await connectionStorage.save({
        id,
        connectionOptions: {
          connectionString: 'mongodb://root:password@localhost:27017',
        },
      });

      expect(
        JSON.parse(fs.readFileSync(getConnectionFilePath(tmpDir, id), 'utf-8'))
          .connectionInfo.id
      ).to.be.equal(id);

      expect(setPasswordSpy.calledOnce).to.be.true;
      expect(setPasswordSpy.firstCall.args).to.deep.equal([
        getKeytarServiceName(),
        id,
        JSON.stringify({ secrets: { password: 'password' } }, null, 2),
      ]);
    });

    it('saves a connection with arbitrary authMechanism (bypass Ampersand validations)', async function () {
      const id: string = uuid();
      await connectionStorage.save({
        id,
        connectionOptions: {
          connectionString: 'mongodb://localhost:27017?authMechanism=FAKEAUTH',
        },
      });

      expect(
        JSON.parse(fs.readFileSync(getConnectionFilePath(tmpDir, id), 'utf-8'))
          .connectionInfo?.connectionOptions?.connectionString
      ).to.be.equal('mongodb://localhost:27017/?authMechanism=FAKEAUTH');
    });

    it('requires id to be set', async function () {
      const error = await connectionStorage
        .save({
          id: '',
          connectionOptions: {
            connectionString: 'mongodb://localhost:27017',
          },
        })
        .catch((err) => err);

      expect(error.message).to.be.equal('id is required');
    });

    it('requires id to be a uuid', async function () {
      const error = await connectionStorage
        .save({
          id: 'someid',
          connectionOptions: {
            connectionString: 'mongodb://localhost:27017',
          },
        })
        .catch((err) => err);

      expect(error.message).to.be.equal('id must be a uuid');
    });

    it('requires connection string to be set', async function () {
      const error = await connectionStorage
        .save({
          id: uuid(),
          connectionOptions: {
            connectionString: '',
          },
        })
        .catch((err) => err);

      expect(error.message).to.be.equal('Connection string is required.');
    });

    it('does not save fle secrets if fleOptions.storeCredentials is false', async function () {
      const id = uuid();
      const setPasswordSpy = Sinon.spy(keytar, 'setPassword');
      await connectionStorage.save({
        id,
        connectionOptions: {
          connectionString: 'mongodb://localhost:27017',
          fleOptions: {
            storeCredentials: false,
            autoEncryption: {
              keyVaultNamespace: 'db.coll',
              kmsProviders: {
                local: {
                  key: 'my-key',
                },
              },
            },
          },
        },
      });

      const { connectionInfo } = JSON.parse(
        fs.readFileSync(getConnectionFilePath(tmpDir, id), 'utf-8')
      );

      expect(connectionInfo.connectionOptions.fleOptions).to.deep.equal({
        storeCredentials: false,
        autoEncryption: {
          keyVaultNamespace: 'db.coll',
          kmsProviders: {},
        },
      });
      expect(setPasswordSpy.calledOnce).to.be.true;
      expect(setPasswordSpy.firstCall.args).to.deep.equal([
        getKeytarServiceName(),
        id,
        JSON.stringify({ secrets: {} }, null, 2),
      ]);
    });

    it('saves fle secrets if fleOptions.storeCredentials is true', async function () {
      const id = uuid();
      const setPasswordSpy = Sinon.spy(keytar, 'setPassword');
      await connectionStorage.save({
        id,
        connectionOptions: {
          connectionString: 'mongodb://localhost:27017',
          fleOptions: {
            storeCredentials: true,
            autoEncryption: {
              keyVaultNamespace: 'db.coll',
              kmsProviders: {
                local: {
                  key: 'my-key',
                },
              },
            },
          },
        },
      });

      const { connectionInfo } = JSON.parse(
        fs.readFileSync(getConnectionFilePath(tmpDir, id), 'utf-8')
      );

      expect(connectionInfo.connectionOptions.fleOptions).to.deep.equal({
        storeCredentials: true,
        autoEncryption: {
          keyVaultNamespace: 'db.coll',
          kmsProviders: {},
        },
      });

      expect(setPasswordSpy.calledOnce).to.be.true;
      expect(setPasswordSpy.firstCall.args).to.deep.equal([
        getKeytarServiceName(),
        id,
        JSON.stringify(
          {
            secrets: {
              autoEncryption: {
                kmsProviders: {
                  local: {
                    key: 'my-key',
                  },
                },
              },
            },
          },
          null,
          2
        ),
      ]);
    });
  });

  describe('destroy', function () {
    it('removes a connection', async function () {
      const connectionInfo = getConnectionInfo();
      writeFakeConnection(tmpDir, {
        connectionInfo,
      });

      expect(fs.existsSync(getConnectionFilePath(tmpDir, connectionInfo.id))).to
        .be.true;

      const deletePasswordSpy = Sinon.spy(keytar, 'deletePassword');
      await connectionStorage.delete(connectionInfo.id);

      const filePath = getConnectionFilePath(tmpDir, connectionInfo.id);
      expect(fs.existsSync(filePath)).to.be.false;

      expect(deletePasswordSpy.calledOnce).to.be.true;
      expect(deletePasswordSpy.firstCall.args).to.deep.equal([
        getKeytarServiceName(),
        connectionInfo.id,
      ]);
    });
  });

  describe('hasLegacyConnections', function () {
    it('returns false if there are no legacy connections', async function () {
      const connectionInfo = getConnectionInfo();
      writeFakeConnection(tmpDir, {
        connectionInfo,
      });
      const hasLegacyConnections =
        await connectionStorage.hasLegacyConnections();
      expect(hasLegacyConnections).to.be.false;
    });

    it('returns true if there are legacy connections', async function () {
      const _id = uuid();

      // Save a legacy connection (connection without connectionInfo)
      const filePath = getConnectionFilePath(tmpDir, _id);
      fs.writeFileSync(
        filePath,
        JSON.stringify({
          _id,
          hosts: [{ host: 'localhost', port: 27017 }],
          readPreference: 'primary',
          port: 27017,
          hostname: 'localhost',
        })
      );

      const hasLegacyConnections =
        await connectionStorage.hasLegacyConnections();
      expect(hasLegacyConnections).to.be.true;
    });
  });
});
