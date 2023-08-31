import { expect } from 'chai';

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { UUID } from 'bson';
import { sortBy } from 'lodash';
import type { ZodError } from 'zod';

import { ConnectionStorage } from './connection-storage';
import type { ConnectionInfo } from './connection-info';
import Sinon from 'sinon';

import connection1270 from './../test/fixtures/favorite_connection_1.27.0.json';
import connection1310 from './../test/fixtures/favorite_connection_1.31.0.json';
import connection1380 from './../test/fixtures/favorite_connection_1.38.0.json';

function getConnectionFilePath(tmpDir: string, id: string): string {
  const connectionsDir = path.join(tmpDir, 'Connections');
  const filePath = path.join(connectionsDir, `${id}.json`);
  return filePath;
}

function getConnectionInfo(props: Partial<ConnectionInfo> = {}) {
  return {
    id: new UUID().toString(),
    connectionOptions: {
      connectionString:
        'mongodb://localhost:27017/?readPreference=primary&ssl=false&directConnection=true',
    },
    ...props,
  };
}

async function writeFakeConnection(
  tmpDir: string,
  connection: { connectionInfo: ConnectionInfo }
) {
  const filePath = getConnectionFilePath(tmpDir, connection.connectionInfo.id);
  const connectionsDir = path.dirname(filePath);
  await fs.mkdir(connectionsDir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(connection));
}

const maxAllowedConnections = 10;

describe('ConnectionStorage', function () {
  const initialKeytarEnvValue = process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE;
  const ipcMain = ConnectionStorage['ipcMain'];

  let tmpDir: string;
  beforeEach(async function () {
    tmpDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'connection-storage-tests')
    );
    ConnectionStorage['ipcMain'] = { handle: Sinon.stub() };
    ConnectionStorage.init(tmpDir);

    process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE = 'true';
  });

  afterEach(async function () {
    ConnectionStorage['calledOnce'] = false;
    await fs.rm(tmpDir, { recursive: true });
    Sinon.restore();

    ConnectionStorage['calledOnce'] = false;
    ConnectionStorage['ipcMain'] = ipcMain;

    if (initialKeytarEnvValue) {
      process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE = initialKeytarEnvValue;
    } else {
      delete process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE;
    }
  });

  describe('loadAll', function () {
    it('should load an empty array with no connections', async function () {
      const connections = await ConnectionStorage.loadAll();
      expect(connections).to.deep.equal([]);
    });

    it('should return an array of saved connections', async function () {
      const connectionInfo = getConnectionInfo({ lastUsed: new Date() });
      await writeFakeConnection(tmpDir, { connectionInfo });
      const connections = await ConnectionStorage.loadAll();
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
      await writeFakeConnection(tmpDir, {
        connectionInfo: connectionInfo1,
      });

      await writeFakeConnection(tmpDir, {
        connectionInfo: connectionInfo2,
      });
      const connections = await ConnectionStorage.loadAll();
      expect(connections).to.deep.equal([connectionInfo2]);
    });

    it('should convert lastUsed', async function () {
      const lastUsed = new Date('2021-10-26T13:51:27.585Z');
      const connectionInfo = getConnectionInfo({ lastUsed });
      await writeFakeConnection(tmpDir, {
        connectionInfo,
      });

      const connections = await ConnectionStorage.loadAll();
      expect(connections[0].lastUsed).to.deep.equal(lastUsed);
    });
  });

  describe('load', function () {
    it('should return undefined if id is undefined', async function () {
      expect(await ConnectionStorage.load({ id: undefined })).to.be.undefined;
      expect(await ConnectionStorage.load({ id: '' })).to.be.undefined;
    });

    it('should return undefined if a connection does not exist', async function () {
      const connection = await ConnectionStorage.load({
        id: 'note-exis-stin-gone',
      });
      expect(connection).to.be.undefined;
    });

    it('should return an existing connection', async function () {
      const connectionInfo = getConnectionInfo();
      await writeFakeConnection(tmpDir, {
        connectionInfo,
      });
      const connection = await ConnectionStorage.load({
        id: connectionInfo.id,
      });
      expect(connection).to.deep.equal(connectionInfo);
    });

    it('should convert lastUsed', async function () {
      const lastUsed = new Date('2021-10-26T13:51:27.585Z');
      const connectionInfo = getConnectionInfo({
        lastUsed,
      });
      await writeFakeConnection(tmpDir, { connectionInfo });

      const connection = await ConnectionStorage.load({
        id: connectionInfo.id,
      });
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
        await writeFakeConnection(tmpDir, { connectionInfo });

        const connection = await ConnectionStorage.load({
          id: connectionInfo.id,
        });
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
        await writeFakeConnection(tmpDir, { connectionInfo });

        const connection = await ConnectionStorage.load({
          id: connectionInfo.id,
        });
        expect(connection!.connectionOptions.connectionString).to.deep.equal(
          'mongodb://localhost:27017/admin?appName=Something+Else'
        );
      });
    });
  });

  describe('save', function () {
    it('saves a valid connection object', async function () {
      const id = new UUID().toString();
      try {
        await fs.access(getConnectionFilePath(tmpDir, id));
        expect.fail('Expected connction to not exist');
      } catch (e) {
        expect((e as any).code).to.equal('ENOENT');
      }
      await ConnectionStorage.save({
        connectionInfo: {
          id,
          connectionOptions: {
            connectionString: 'mongodb://root:password@localhost:27017',
          },
        },
      });

      const content = await fs.readFile(
        getConnectionFilePath(tmpDir, id),
        'utf-8'
      );
      expect(JSON.parse(content).connectionInfo.id).to.be.equal(id);
    });

    it('saves a connection with arbitrary authMechanism', async function () {
      const id = new UUID().toString();
      await ConnectionStorage.save({
        connectionInfo: {
          id,
          connectionOptions: {
            connectionString:
              'mongodb://localhost:27017/?authMechanism=FAKEAUTH',
          },
        },
      });

      const content = await fs.readFile(
        getConnectionFilePath(tmpDir, id),
        'utf-8'
      );
      expect(
        JSON.parse(content).connectionInfo?.connectionOptions?.connectionString
      ).to.be.equal('mongodb://localhost:27017/?authMechanism=FAKEAUTH');
    });

    it('requires id to be set', async function () {
      try {
        await ConnectionStorage.save({
          connectionInfo: {
            id: '',
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
          },
        });
      } catch (e) {
        const errors = (e as ZodError).errors;
        const message = errors[0].message;
        expect(message).to.be.equal('Invalid uuid');
      }
    });

    it('requires id to be a uuid', async function () {
      try {
        await ConnectionStorage.save({
          connectionInfo: {
            id: 'someid',
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
          },
        });
      } catch (e) {
        const errors = (e as ZodError).errors;
        const message = errors[0].message;
        expect(message).to.be.equal('Invalid uuid');
      }
    });

    it('requires connection string to be set', async function () {
      try {
        await ConnectionStorage.save({
          connectionInfo: {
            id: new UUID().toString(),
            connectionOptions: {
              connectionString: '',
            },
          },
        });
        expect.fail('Expected connection string to be required.');
      } catch (e) {
        const errors = (e as ZodError).errors;
        const message = errors[0].message;
        expect(message).to.be.equal('Connection string is required.');
      }
    });

    // In tests we can not use keytar and have it disabled. When saving any data,
    // its completely stored on disk without anything removed.
    it('it stores all the fleOptions on disk', async function () {
      const id = new UUID().toString();
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
      await ConnectionStorage.save({ connectionInfo });

      const content = await fs.readFile(
        getConnectionFilePath(tmpDir, id),
        'utf-8'
      );
      const { connectionInfo: expectedConnectionInfo } = JSON.parse(content);
      expect(expectedConnectionInfo).to.deep.equal(connectionInfo);
    });

    it('saves a connection with _id', async function () {
      const id = new UUID().toString();
      try {
        await fs.access(getConnectionFilePath(tmpDir, id));
      } catch (e) {
        expect(e).to.be.instanceOf(Error);
      }

      await ConnectionStorage.save({
        connectionInfo: {
          id,
          connectionOptions: {
            connectionString: 'mongodb://root:password@localhost:27017',
          },
        },
      });

      const savedConnection = JSON.parse(
        await fs.readFile(getConnectionFilePath(tmpDir, id), 'utf-8')
      );

      expect(savedConnection).to.deep.equal({
        connectionInfo: {
          id,
          connectionOptions: {
            connectionString: 'mongodb://root:password@localhost:27017',
          },
        },
        _id: id,
      });
    });

    context(`max allowed connections ${maxAllowedConnections}`, function () {
      const createNumberOfConnections = async (num: number) => {
        const connectionInfos = Array.from({ length: num }, (v, i) =>
          getConnectionInfo({
            lastUsed: new Date(1690876213077 - (i + 1) * 1000), // Difference of 1 sec
          })
        );

        await Promise.all(
          connectionInfos.map((connectionInfo) =>
            writeFakeConnection(tmpDir, { connectionInfo })
          )
        );

        return connectionInfos;
      };

      it('truncates recents to max allowed connections', async function () {
        const connectionInfos = await createNumberOfConnections(
          maxAllowedConnections
        );

        const deleteSpy = Sinon.spy(ConnectionStorage, 'delete');

        // Save another connection
        await ConnectionStorage.save({ connectionInfo: getConnectionInfo() });

        const numConnections = (await ConnectionStorage.loadAll()).length;
        expect(numConnections).to.equal(maxAllowedConnections);

        expect(
          deleteSpy.calledOnceWithExactly({
            id: connectionInfos[connectionInfos.length - 1].id,
          })
        ).to.be.true;
      });

      it('does not remove recent if recent connections are less then max allowed connections', async function () {
        await createNumberOfConnections(maxAllowedConnections - 1);

        const deleteSpy = Sinon.spy(ConnectionStorage, 'delete');

        // Save another connection
        await ConnectionStorage.save({ connectionInfo: getConnectionInfo() });

        const numConnections = (await ConnectionStorage.loadAll()).length;
        expect(numConnections).to.equal(maxAllowedConnections);

        expect(deleteSpy.called).to.be.false;
      });
    });
  });

  describe('destroy', function () {
    it('removes a connection', async function () {
      const connectionInfo = getConnectionInfo();
      await writeFakeConnection(tmpDir, {
        connectionInfo,
      });

      const filePath = getConnectionFilePath(tmpDir, connectionInfo.id);

      await fs.access(filePath);

      await ConnectionStorage.delete({ id: connectionInfo.id });

      try {
        await fs.access(filePath);
        expect.fail('Expected connction to not exist');
      } catch (e) {
        expect((e as any).code).to.equal('ENOENT');
      }
    });
  });

  describe('getLegacyConnections', function () {
    it('returns false if there are no legacy connections', async function () {
      const connectionInfo = getConnectionInfo();
      await writeFakeConnection(tmpDir, {
        connectionInfo,
      });
      const getLegacyConnections =
        await ConnectionStorage.getLegacyConnections();
      expect(getLegacyConnections).to.have.lengthOf(0);
    });

    it('returns false if there are no favorite legacy connections', async function () {
      const _id = new UUID().toString();

      // Save a legacy connection (connection without connectionInfo, which is not favorite)
      const filePath = getConnectionFilePath(tmpDir, _id);
      // As we are saving a legacy connection here, we can not use Storage.save as
      // it requries connectionInfo. And the internals of fs ensure the subdir exists,
      // here we are creating it manually.
      await fs.mkdir(path.join(tmpDir, 'Connections'), { recursive: true });
      await fs.writeFile(
        filePath,
        JSON.stringify({
          _id,
          hosts: [{ host: 'localhost', port: 27017 }],
          readPreference: 'primary',
          port: 27017,
          hostname: 'localhost',
        })
      );

      const getLegacyConnections =
        await ConnectionStorage.getLegacyConnections();
      expect(getLegacyConnections).to.have.lengthOf(0);
    });

    it('returns true if there are favorite legacy connections', async function () {
      const _id = new UUID().toString();

      // Save a legacy connection (connection without connectionInfo)
      const filePath = getConnectionFilePath(tmpDir, _id);
      // As we are saving a legacy connection here, we can not use Storage.save as
      // it requries connectionInfo. And the internals of fs ensure the subdir exists,
      // here we are creating it manually.
      await fs.mkdir(path.join(tmpDir, 'Connections'), { recursive: true });
      await fs.writeFile(
        filePath,
        JSON.stringify({
          _id,
          isFavorite: true,
          name: 'Local 1',
          hosts: [{ host: 'localhost', port: 27017 }],
          readPreference: 'primary',
          port: 27017,
          hostname: 'localhost',
        })
      );

      const getLegacyConnections =
        await ConnectionStorage.getLegacyConnections();
      expect(getLegacyConnections).to.deep.equal([{ name: 'Local 1' }]);
    });
  });

  describe('import/export connections', function () {
    // By default we only export favorite connections
    const CONNECTIONS = [
      getConnectionInfo({
        favorite: {
          name: 'Connection 1',
        },
      }),
      getConnectionInfo({
        favorite: {
          name: 'Connection 2',
        },
      }),
    ];

    beforeEach(async function () {
      await Promise.all(
        CONNECTIONS.map((connectionInfo) =>
          writeFakeConnection(tmpDir, { connectionInfo })
        )
      );
    });

    it('exports connections with default options', async function () {
      const exportedConnections = await ConnectionStorage.exportConnections();
      const parsedConnections = JSON.parse(exportedConnections);

      const connectionNames = parsedConnections.connections.map(
        (x: ConnectionInfo) => x.favorite?.name
      );

      expect(parsedConnections.connections).to.have.lengthOf(2);
      expect(connectionNames.includes('Connection 1')).to.be.true;
      expect(connectionNames.includes('Connection 2')).to.be.true;
    });

    it('exports connections with filter', async function () {
      const exportedConnections = await ConnectionStorage.exportConnections({
        options: {
          filterConnectionIds: [CONNECTIONS[1].id],
        },
      });
      const parsedConnections = JSON.parse(exportedConnections);

      const connectionNames = parsedConnections.connections.map(
        (x: ConnectionInfo) => x.favorite?.name
      );

      expect(parsedConnections.connections).to.have.lengthOf(1);
      expect(connectionNames.includes('Connection 1')).to.be.false;
      expect(connectionNames.includes('Connection 2')).to.be.true;
    });

    it('imports connections with default options', async function () {
      const exportedConnections = await ConnectionStorage.exportConnections();

      // now remove connections
      await Promise.all(
        CONNECTIONS.map(({ id }) => ConnectionStorage.delete({ id }))
      );

      await ConnectionStorage.importConnections({
        content: exportedConnections,
      });

      const expectedConnections = await ConnectionStorage.loadAll();

      expect(sortBy(expectedConnections, 'id')).to.deep.equal(
        sortBy(CONNECTIONS, 'id')
      );
    });

    it('imports connections with filter', async function () {
      const exportedConnections = await ConnectionStorage.exportConnections();

      // now remove connections
      await Promise.all(
        CONNECTIONS.map(({ id }) => ConnectionStorage.delete({ id }))
      );

      await ConnectionStorage.importConnections({
        content: exportedConnections,
        options: {
          filterConnectionIds: [CONNECTIONS[1].id],
        },
      });

      const expectedConnections = await ConnectionStorage.loadAll();
      expect(expectedConnections).to.deep.equal([CONNECTIONS[1]]);
    });
  });

  describe('supports conenctions from older version of compass', function () {
    const storeConnection = async (connection: any) => {
      const connectionFolder = path.join(tmpDir, 'Connections');
      const connectionPath = path.join(
        connectionFolder,
        `${connection._id}.json`
      );
      await fs.mkdir(connectionFolder, { recursive: true });
      await fs.writeFile(connectionPath, JSON.stringify(connection));
    };

    it('correctly identifies connection as legacy connection', async function () {
      await storeConnection(connection1270);
      const expectedConnection = await ConnectionStorage.load({
        id: connection1270._id,
      });
      expect(expectedConnection).to.be.undefined;

      const legacyConnections = await ConnectionStorage.getLegacyConnections();
      expect(legacyConnections).to.deep.equal([{ name: connection1270.name }]);
    });

    it(`maps connectons with legacy props and connection info to just connection info`, async function () {
      const connections = {
        '1.31.0': connection1310,
        '1.38.0': connection1380,
      } as any;

      for (const version in connections) {
        const connection = connections[version];
        await storeConnection(connection);
        const expectedConnection = await ConnectionStorage.load({
          id: connection._id,
        });

        expect(expectedConnection, version).to.not.be.undefined;

        // Converts a legacy connection to new connectionInfo
        expect(Object.keys(expectedConnection!)).to.deep.equal([
          'id',
          'lastUsed',
          'favorite',
          'connectionOptions',
        ]);
        expect(expectedConnection!.id, version).to.equal(connection._id);
        expect(expectedConnection!.connectionOptions, version).to.deep.equal(
          connection.connectionInfo.connectionOptions
        );
        expect(expectedConnection!.lastUsed, version).to.deep.equal(
          new Date(connection.lastUsed)
        );
        expect(expectedConnection!.favorite?.name, version).to.equal(
          connection.name
        );
        expect(expectedConnection!.favorite?.color, version).to.equal(
          connection.color
        );
      }
    });
  });
});
