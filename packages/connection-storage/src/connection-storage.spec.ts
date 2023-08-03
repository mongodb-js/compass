import { expect } from 'chai';

import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuid } from 'uuid';

import { ConnectionStorage } from './connection-storage';
import type { ConnectionInfo } from './connection-info';
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

const initialKeytarEnvValue = process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE;

const maxAllowedConnections = 10;

describe('ConnectionStorage', function () {
  let tmpDir: string;
  let connectionStorage: ConnectionStorage;
  beforeEach(function () {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'connection-storage-tests'));
    fs.mkdirSync(path.join(tmpDir, 'Connections'));
    connectionStorage = new ConnectionStorage(tmpDir);
    process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE = 'true';
  });

  afterEach(function () {
    fs.rmdirSync(tmpDir, { recursive: true });
    Sinon.restore();
    process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE = initialKeytarEnvValue;
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

    context('handles appName param', function () {
      it('should remove appName if it matches MongoDB Compass', async function () {
        const connectionInfo = getConnectionInfo({
          connectionOptions: {
            connectionString:
              'mongodb://localhost:27017/admin?appName=MongoDB+Compass',
          },
        });
        writeFakeConnection(tmpDir, { connectionInfo });

        const connection = await connectionStorage.load(connectionInfo.id);
        expect(connection!.connectionOptions.connectionString).to.deep.equal(
          'mongodb://localhost:27017/admin'
        );
      });

      it('should not remove appName if it does not match MongoDB Compass', async function () {
        const connectionInfo = getConnectionInfo({
          connectionOptions: {
            connectionString:
              'mongodb://localhost:27017/admin?appName=Something+Else',
          },
        });
        writeFakeConnection(tmpDir, { connectionInfo });

        const connection = await connectionStorage.load(connectionInfo.id);
        expect(connection!.connectionOptions.connectionString).to.deep.equal(
          'mongodb://localhost:27017/admin?appName=Something+Else'
        );
      });
    });
  });

  describe('save', function () {
    it('saves a valid connection object', async function () {
      const id: string = uuid();
      expect(fs.existsSync(getConnectionFilePath(tmpDir, id))).to.be.false;

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
    });

    it('saves a connection with arbitrary authMechanism', async function () {
      const id: string = uuid();
      await connectionStorage.save({
        id,
        connectionOptions: {
          connectionString: 'mongodb://localhost:27017/?authMechanism=FAKEAUTH',
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

    // In tests we can not use keytar and have it disabled. When saving any data,
    // its completely stored on disk without anything removed.
    it('it stores all the fleOptions on disk', async function () {
      const id = uuid();
      const connectionInfo = {
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
      };
      await connectionStorage.save(connectionInfo);

      const { connectionInfo: expectedConnectionInfo } = JSON.parse(
        fs.readFileSync(getConnectionFilePath(tmpDir, id), 'utf-8')
      );
      expect(expectedConnectionInfo).to.deep.equal(connectionInfo);
    });

    context(`max allowed connections ${maxAllowedConnections}`, function () {
      const createNumberOfConnections = (num: number) => {
        const connectionInfos = Array.from({ length: num }, (v, i) =>
          getConnectionInfo({
            lastUsed: new Date(1690876213077 - (i + 1) * 1000), // Difference of 1 sec
          })
        );
        connectionInfos.forEach((connectionInfo) =>
          writeFakeConnection(tmpDir, { connectionInfo })
        );

        return connectionInfos;
      };

      it('truncates recents to max allowed connections', async function () {
        const connectionInfos = createNumberOfConnections(
          maxAllowedConnections
        );

        const deleteSpy = Sinon.spy(connectionStorage, 'delete');

        // Save another connection
        await connectionStorage.save(getConnectionInfo());

        const numConnections = (await connectionStorage.loadAll()).length;
        expect(numConnections).to.equal(maxAllowedConnections);

        expect(
          deleteSpy.calledOnceWithExactly(
            connectionInfos[connectionInfos.length - 1].id
          )
        ).to.be.true;
      });

      it('does not remove recent if recent connections are less then max allowed connections', async function () {
        createNumberOfConnections(maxAllowedConnections - 1);

        const deleteSpy = Sinon.spy(connectionStorage, 'delete');

        // Save another connection
        await connectionStorage.save(getConnectionInfo());

        const numConnections = (await connectionStorage.loadAll()).length;
        expect(numConnections).to.equal(maxAllowedConnections);

        expect(deleteSpy.called).to.be.false;
      });
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

      await connectionStorage.delete(connectionInfo.id);

      const filePath = getConnectionFilePath(tmpDir, connectionInfo.id);
      expect(fs.existsSync(filePath)).to.be.false;
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

    it('returns false if there are no favorite legacy connections', async function () {
      const _id = uuid();

      // Save a legacy connection (connection without connectionInfo, which is not favorite)
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
      expect(hasLegacyConnections).to.be.false;
    });

    it('returns true if there are favorite legacy connections', async function () {
      const _id = uuid();

      // Save a legacy connection (connection without connectionInfo)
      const filePath = getConnectionFilePath(tmpDir, _id);
      fs.writeFileSync(
        filePath,
        JSON.stringify({
          _id,
          isFavorite: true,
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
