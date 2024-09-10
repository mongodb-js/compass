import { expect } from 'chai';

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { UUID } from 'bson';
import { sortBy } from 'lodash';

import {
  initCompassMainConnectionStorage,
  type CompassMainConnectionStorage,
  type ConnectionWithLegacyProps,
  type ConnectionStorageIPCMain,
} from './compass-main-connection-storage';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import Sinon from 'sinon';

import connection1270 from '../test/fixtures/favorite_connection_1.27.0.json';
import connection1310 from '../test/fixtures/favorite_connection_1.31.0.json';
import connection1380 from '../test/fixtures/favorite_connection_1.38.0.json';
import * as exportedConnectionFixtures from '../test/fixtures/compass-connections';

function getConnectionFilePath(tmpDir: string, id: string): string {
  const connectionsDir = path.join(tmpDir, 'Connections');
  const filePath = path.join(connectionsDir, `${id}.json`);
  return filePath;
}

function getExportedConnectionsFilePath(tmpDir: string): string {
  return path.join(tmpDir, 'exported-connections.json');
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
  connection: ConnectionWithLegacyProps
) {
  const _id = connection._id || connection.connectionInfo?.id;
  if (!_id) {
    throw new Error('Connection should have _id or connectionInfo.id');
  }
  const filePath = getConnectionFilePath(tmpDir, _id);
  const connectionsDir = path.dirname(filePath);
  await fs.mkdir(connectionsDir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(connection));
}

async function writeExportedConnectionsFile(tmpDir: string, data: string) {
  await fs.writeFile(getExportedConnectionsFilePath(tmpDir), data);
}

async function readConnection(tmpDir: string, id: string) {
  const content = await fs.readFile(getConnectionFilePath(tmpDir, id), 'utf-8');
  return JSON.parse(content);
}

const maxAllowedConnections = 10;

describe('ConnectionStorage', function () {
  let connectionStorage: CompassMainConnectionStorage;
  let ipcMain: ConnectionStorageIPCMain;

  let tmpDir: string;
  beforeEach(async function () {
    ipcMain = {
      createHandle: Sinon.stub(),
    };
    tmpDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'connection-storage-tests')
    );

    connectionStorage = initCompassMainConnectionStorage(tmpDir, ipcMain, true);
  });

  afterEach(async function () {
    await fs.rm(tmpDir, { recursive: true });
    Sinon.restore();
  });

  describe('migrateToSafeStorage', function () {
    let sandbox: Sinon.SinonSandbox;
    beforeEach(function () {
      sandbox = Sinon.createSandbox();
    });

    afterEach(function () {
      sandbox.restore();
    });

    context('does not migrate connections', function () {
      it('when there are no connections', async function () {
        await connectionStorage.migrateToSafeStorage();
        const connections = await connectionStorage.loadAll();
        expect(connections).to.deep.equal([]);
      });

      it('when there are only legacy connections', async function () {
        await writeFakeConnection(tmpDir, connection1270);

        const encryptSecretsSpy = sandbox.spy(
          connectionStorage,
          'encryptSecrets' as any
        );
        const getKeytarCredentialsSpy = sandbox.spy(
          connectionStorage,
          'getKeytarCredentials' as any
        );

        await connectionStorage.migrateToSafeStorage();

        expect(
          encryptSecretsSpy.called,
          'it does not try to encrypt'
        ).to.be.false;
        expect(
          getKeytarCredentialsSpy.called,
          'it does not try to get secrets from keychain'
        ).to.be.false;
      });

      it('when there are only migrated connections', async function () {
        const connectionInfo1 = getConnectionInfo();
        const connectionInfo2 = getConnectionInfo();

        await writeFakeConnection(tmpDir, {
          _id: connectionInfo1.id,
          connectionInfo: connectionInfo1,
          version: 1,
        });
        await writeFakeConnection(tmpDir, {
          _id: connectionInfo2.id,
          connectionInfo: connectionInfo2,
          version: 1,
        });

        const encryptSecretsSpy = sandbox.spy(
          connectionStorage,
          'encryptSecrets' as any
        );
        const getKeytarCredentialsSpy = sandbox.spy(
          connectionStorage,
          'getKeytarCredentials' as any
        );

        await connectionStorage.migrateToSafeStorage();

        expect(
          encryptSecretsSpy.called,
          'it does not try to encrypt'
        ).to.be.false;
        expect(
          getKeytarCredentialsSpy.called,
          'it does not try to get secrets from keychain'
        ).to.be.false;

        const expectedConnection1 = await readConnection(
          tmpDir,
          connectionInfo1.id
        );
        const expectedConnection2 = await readConnection(
          tmpDir,
          connectionInfo2.id
        );

        expect(expectedConnection1).to.deep.equal({
          _id: connectionInfo1.id,
          connectionInfo: connectionInfo1,
          version: 1,
        });

        expect(expectedConnection2).to.deep.equal({
          _id: connectionInfo2.id,
          connectionInfo: connectionInfo2,
          version: 1,
        });
      });
    });

    context('migrates connections', function () {
      it('when there are connections and secrets in keychain', async function () {
        const connectionInfo1 = getConnectionInfo();
        const connectionInfo2 = getConnectionInfo();
        await writeFakeConnection(tmpDir, {
          connectionInfo: connectionInfo1,
        });
        await writeFakeConnection(tmpDir, {
          connectionInfo: connectionInfo2,
        });

        // Keytar stub
        sandbox.stub(connectionStorage, 'getKeytarCredentials' as any).returns({
          [connectionInfo1.id]: {
            password: 'password1',
          },
          [connectionInfo2.id]: {
            password: 'password2',
          },
        });

        // safeStorage.encryptString stub
        sandbox
          .stub(connectionStorage, 'encryptSecrets' as any)
          .returns('encrypted-password');

        await connectionStorage.migrateToSafeStorage();

        const expectedConnection1 = await readConnection(
          tmpDir,
          connectionInfo1.id
        );
        const expectedConnection2 = await readConnection(
          tmpDir,
          connectionInfo2.id
        );

        expect(expectedConnection1).to.deep.equal({
          _id: connectionInfo1.id,
          connectionInfo: connectionInfo1,
          connectionSecrets: 'encrypted-password',
          version: 1,
        });
        expect(expectedConnection2).to.deep.equal({
          _id: connectionInfo2.id,
          connectionInfo: connectionInfo2,
          connectionSecrets: 'encrypted-password',
          version: 1,
        });
      });
      it('when there are connections and no secrets in keychain', async function () {
        const connectionInfo1 = getConnectionInfo();
        const connectionInfo2 = getConnectionInfo();
        await writeFakeConnection(tmpDir, {
          connectionInfo: connectionInfo1,
        });
        await writeFakeConnection(tmpDir, {
          connectionInfo: connectionInfo2,
        });

        // Keytar fake
        sandbox
          .stub(connectionStorage, 'getKeytarCredentials' as any)
          .returns({});

        // Since there're no secrets in keychain, we do not expect to call safeStorage.encryptString
        // and connection.connectionSecrets should be undefined

        await connectionStorage.migrateToSafeStorage();

        const expectedConnection1 = await readConnection(
          tmpDir,
          connectionInfo1.id
        );
        const expectedConnection2 = await readConnection(
          tmpDir,
          connectionInfo2.id
        );

        expect(expectedConnection1).to.deep.equal({
          _id: connectionInfo1.id,
          connectionInfo: connectionInfo1,
          version: 1,
        });
        expect(expectedConnection2).to.deep.equal({
          _id: connectionInfo2.id,
          connectionInfo: connectionInfo2,
          version: 1,
        });
      });

      it('when there are any unmigrated connections', async function () {
        const connectionInfo1 = getConnectionInfo();
        const connectionInfo2 = getConnectionInfo();
        await writeFakeConnection(tmpDir, {
          _id: connectionInfo1.id,
          connectionInfo: connectionInfo1,
          version: 1,
        });
        await writeFakeConnection(tmpDir, {
          connectionInfo: connectionInfo2,
        });

        // Keytar stub
        sandbox
          .stub(connectionStorage, 'getKeytarCredentials' as any)
          .returns({});

        await connectionStorage.migrateToSafeStorage();

        const expectedConnection1 = await readConnection(
          tmpDir,
          connectionInfo1.id
        );
        const expectedConnection2 = await readConnection(
          tmpDir,
          connectionInfo2.id
        );

        expect(expectedConnection1).to.deep.equal({
          _id: connectionInfo1.id,
          connectionInfo: connectionInfo1,
          version: 1,
        });
        expect(expectedConnection2).to.deep.equal({
          _id: connectionInfo2.id,
          connectionInfo: connectionInfo2,
          version: 1,
        });
      });
    });

    context(
      'imports already exported connections from compass using keytar',
      function () {
        const exportedConnections = [
          {
            label: 'connection with plain secrets',
            data: exportedConnectionFixtures.connectionsWithPlainSecrets,
          },
          {
            label: 'connection with encrypted secrets',
            data: exportedConnectionFixtures.connectionsWithEncryptedSecrets,
            importOptions: {
              passphrase: 'password',
            },
          },
        ];

        for (const exportUseCase of exportedConnections) {
          it(exportUseCase.label, async function () {
            const countOfConnections = exportUseCase.data.connections.length;
            // Import
            {
              // When importing connections, we will encrypt secrets using safeStorage.
              // So, we mock the *encryptSecrets* implementation to not trigger keychain.
              const encryptSecretsStub = sandbox
                .stub(connectionStorage, 'encryptSecrets' as any)
                .returns('encrypted-password');
              // Import
              await connectionStorage.importConnections({
                content: JSON.stringify(exportUseCase.data),
                options: exportUseCase.importOptions,
              });
              expect(
                encryptSecretsStub.getCalls().map((x) => x.args),
                `makes ${countOfConnections} calls with correct arguments when encrypting`
              ).to.deep.equal(
                Array.from({ length: countOfConnections }).map(() => [
                  { password: 'password' },
                ])
              );
            }

            // Read imported connections using ConnectionStorage
            {
              // When reading, we will mock *decryptSecrets* implementation.
              const decryptSecretsStub = sandbox
                .stub(connectionStorage, 'decryptSecrets' as any)
                .returns({ password: 'password' });

              const connections = await connectionStorage.loadAll();

              expect(connections).to.have.lengthOf(countOfConnections);

              expect(
                decryptSecretsStub.getCalls().map((x) => x.args),
                `makes ${countOfConnections} calls with correct arguments when decrypting`
              ).to.deep.equal(
                Array.from({ length: countOfConnections }).map(() => [
                  'encrypted-password',
                ])
              );
            }

            // Read imported connections using fs from disk
            {
              const connections = await Promise.all(
                exportUseCase.data.connections.map(({ id }) =>
                  readConnection(tmpDir, id)
                )
              );

              expect(connections).to.have.lengthOf(countOfConnections);

              for (const connection of connections) {
                expect(connection).to.have.a.property('version', 1);
                expect(connection).to.have.a.property(
                  'connectionSecrets',
                  'encrypted-password'
                );
              }
            }
          });
        }
      }
    );
  });

  describe('migrateToSafeStorage', function () {
    let sandbox: Sinon.SinonSandbox;
    beforeEach(function () {
      sandbox = Sinon.createSandbox();
    });

    afterEach(function () {
      sandbox.restore();
    });

    context('does not migrate connections', function () {
      it('when there are no connections', async function () {
        await connectionStorage.migrateToSafeStorage();
        const connections = await connectionStorage.loadAll();
        expect(connections).to.deep.equal([]);
      });

      it('when there are only legacy connections', async function () {
        await writeFakeConnection(tmpDir, connection1270);

        const encryptSecretsSpy = sandbox.spy(
          connectionStorage,
          'encryptSecrets' as any
        );
        const getKeytarCredentialsSpy = sandbox.spy(
          connectionStorage,
          'getKeytarCredentials' as any
        );

        await connectionStorage.migrateToSafeStorage();

        expect(
          encryptSecretsSpy.called,
          'it does not try to encrypt'
        ).to.be.false;
        expect(
          getKeytarCredentialsSpy.called,
          'it does not try to get secrets from keychain'
        ).to.be.false;
      });

      it('when there are only migrated connections', async function () {
        const connectionInfo1 = getConnectionInfo();
        const connectionInfo2 = getConnectionInfo();

        await writeFakeConnection(tmpDir, {
          _id: connectionInfo1.id,
          connectionInfo: connectionInfo1,
          version: 1,
        });
        await writeFakeConnection(tmpDir, {
          _id: connectionInfo2.id,
          connectionInfo: connectionInfo2,
          version: 1,
        });

        const encryptSecretsSpy = sandbox.spy(
          connectionStorage,
          'encryptSecrets' as any
        );
        const getKeytarCredentialsSpy = sandbox.spy(
          connectionStorage,
          'getKeytarCredentials' as any
        );

        await connectionStorage.migrateToSafeStorage();

        expect(
          encryptSecretsSpy.called,
          'it does not try to encrypt'
        ).to.be.false;
        expect(
          getKeytarCredentialsSpy.called,
          'it does not try to get secrets from keychain'
        ).to.be.false;

        const expectedConnection1 = await readConnection(
          tmpDir,
          connectionInfo1.id
        );
        const expectedConnection2 = await readConnection(
          tmpDir,
          connectionInfo2.id
        );

        expect(expectedConnection1).to.deep.equal({
          _id: connectionInfo1.id,
          connectionInfo: connectionInfo1,
          version: 1,
        });

        expect(expectedConnection2).to.deep.equal({
          _id: connectionInfo2.id,
          connectionInfo: connectionInfo2,
          version: 1,
        });
      });
    });

    context('migrates connections', function () {
      it('when there are connections and secrets in keychain', async function () {
        const connectionInfo1 = getConnectionInfo();
        const connectionInfo2 = getConnectionInfo();
        await writeFakeConnection(tmpDir, {
          connectionInfo: connectionInfo1,
        });
        await writeFakeConnection(tmpDir, {
          connectionInfo: connectionInfo2,
        });

        // Keytar stub
        sandbox.stub(connectionStorage, 'getKeytarCredentials' as any).returns({
          [connectionInfo1.id]: {
            password: 'password1',
          },
          [connectionInfo2.id]: {
            password: 'password2',
          },
        });

        // safeStorage.encryptString stub
        sandbox
          .stub(connectionStorage, 'encryptSecrets' as any)
          .returns('encrypted-password');

        await connectionStorage.migrateToSafeStorage();

        const expectedConnection1 = await readConnection(
          tmpDir,
          connectionInfo1.id
        );
        const expectedConnection2 = await readConnection(
          tmpDir,
          connectionInfo2.id
        );

        expect(expectedConnection1).to.deep.equal({
          _id: connectionInfo1.id,
          connectionInfo: connectionInfo1,
          connectionSecrets: 'encrypted-password',
          version: 1,
        });
        expect(expectedConnection2).to.deep.equal({
          _id: connectionInfo2.id,
          connectionInfo: connectionInfo2,
          connectionSecrets: 'encrypted-password',
          version: 1,
        });
      });
      it('when there are connections and no secrets in keychain', async function () {
        const connectionInfo1 = getConnectionInfo();
        const connectionInfo2 = getConnectionInfo();
        await writeFakeConnection(tmpDir, {
          connectionInfo: connectionInfo1,
        });
        await writeFakeConnection(tmpDir, {
          connectionInfo: connectionInfo2,
        });

        // Keytar fake
        sandbox
          .stub(connectionStorage, 'getKeytarCredentials' as any)
          .returns({});

        // Since there're no secrets in keychain, we do not expect to call safeStorage.encryptString
        // and connection.connectionSecrets should be undefined

        await connectionStorage.migrateToSafeStorage();

        const expectedConnection1 = await readConnection(
          tmpDir,
          connectionInfo1.id
        );
        const expectedConnection2 = await readConnection(
          tmpDir,
          connectionInfo2.id
        );

        expect(expectedConnection1).to.deep.equal({
          _id: connectionInfo1.id,
          connectionInfo: connectionInfo1,
          version: 1,
        });
        expect(expectedConnection2).to.deep.equal({
          _id: connectionInfo2.id,
          connectionInfo: connectionInfo2,
          version: 1,
        });
      });

      it('when there are any unmigrated connections', async function () {
        const connectionInfo1 = getConnectionInfo();
        const connectionInfo2 = getConnectionInfo();
        await writeFakeConnection(tmpDir, {
          _id: connectionInfo1.id,
          connectionInfo: connectionInfo1,
          version: 1,
        });
        await writeFakeConnection(tmpDir, {
          connectionInfo: connectionInfo2,
        });

        // Keytar stub
        sandbox
          .stub(connectionStorage, 'getKeytarCredentials' as any)
          .returns({});

        await connectionStorage.migrateToSafeStorage();

        const expectedConnection1 = await readConnection(
          tmpDir,
          connectionInfo1.id
        );
        const expectedConnection2 = await readConnection(
          tmpDir,
          connectionInfo2.id
        );

        expect(expectedConnection1).to.deep.equal({
          _id: connectionInfo1.id,
          connectionInfo: connectionInfo1,
          version: 1,
        });
        expect(expectedConnection2).to.deep.equal({
          _id: connectionInfo2.id,
          connectionInfo: connectionInfo2,
          version: 1,
        });
      });
    });
  });

  describe('loadAll', function () {
    it('should load an empty array with no connections', async function () {
      const connections = await connectionStorage.loadAll();
      expect(connections).to.deep.equal([]);
    });

    it('should return an array of saved connections', async function () {
      const connectionInfo = getConnectionInfo({ lastUsed: new Date() });
      await writeFakeConnection(tmpDir, { connectionInfo });
      const connections = await connectionStorage.loadAll();
      expect(connections).to.deep.equal([
        { ...connectionInfo, savedConnectionType: 'recent' },
      ]);
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
      const connections = await connectionStorage.loadAll();
      expect(connections).to.deep.equal([
        { ...connectionInfo2, savedConnectionType: 'recent' },
      ]);
    });

    it('should convert lastUsed', async function () {
      const lastUsed = new Date('2021-10-26T13:51:27.585Z');
      const connectionInfo = getConnectionInfo({ lastUsed });
      await writeFakeConnection(tmpDir, {
        connectionInfo,
      });

      const connections = await connectionStorage.loadAll();
      expect(connections[0].lastUsed).to.deep.equal(lastUsed);
    });
  });

  describe('load', function () {
    it('should return undefined if id is empty', async function () {
      expect(await connectionStorage.load({ id: '' })).to.be.undefined;
    });

    it('should return undefined if a connection does not exist', async function () {
      const connection = await connectionStorage.load({
        id: 'note-exis-stin-gone',
      });
      expect(connection).to.be.undefined;
    });

    it('should return an existing connection', async function () {
      const connectionInfo = getConnectionInfo();
      await writeFakeConnection(tmpDir, {
        connectionInfo,
      });
      const connection = await connectionStorage.load({
        id: connectionInfo.id,
      });
      expect(connection).to.deep.equal({
        ...connectionInfo,
        savedConnectionType: 'recent',
      });
    });

    it('should convert lastUsed', async function () {
      const lastUsed = new Date('2021-10-26T13:51:27.585Z');
      const connectionInfo = getConnectionInfo({
        lastUsed,
      });
      await writeFakeConnection(tmpDir, { connectionInfo });

      const connection = await connectionStorage.load({
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

        const connection = await connectionStorage.load({
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

        const connection = await connectionStorage.load({
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
      await connectionStorage.save({
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

    it('saves a connection with all ConnectionOptions set', async function () {
      const id = new UUID().toString();
      const connectionOptions: Required<ConnectionInfo['connectionOptions']> = {
        connectionString: 'mongodb://localhost:27017/',
        sshTunnel: { host: 'localhost', port: 2222, username: 'foobar' },
        useApplicationLevelProxy: true,
        oidc: {},
        fleOptions: { storeCredentials: false },
        lookup: () => ({} as any),
      };
      await connectionStorage.save({
        connectionInfo: {
          id,
          connectionOptions,
        },
      });
      delete (connectionOptions as any).lookup; // intentionally not stored

      const content = await fs.readFile(
        getConnectionFilePath(tmpDir, id),
        'utf-8'
      );
      expect(
        JSON.parse(content).connectionInfo.connectionOptions
      ).to.deep.equal(connectionOptions);
      expect(
        (await connectionStorage.load({ id }))?.connectionOptions
      ).to.deep.equal(connectionOptions);
    });

    it('saves a connection with arbitrary authMechanism', async function () {
      const id = new UUID().toString();
      await connectionStorage.save({
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
        await connectionStorage.save({
          connectionInfo: {
            id: '',
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
          },
        });
      } catch (e) {
        expect(e).to.have.nested.property('errors[0].message', 'Invalid uuid');
      }
    });

    it('requires id to be a uuid', async function () {
      try {
        await connectionStorage.save({
          connectionInfo: {
            id: 'someid',
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
          },
        });
      } catch (e) {
        expect(e).to.have.nested.property('errors[0].message', 'Invalid uuid');
      }
    });

    it('requires connection string to be set', async function () {
      try {
        await connectionStorage.save({
          connectionInfo: {
            id: new UUID().toString(),
            connectionOptions: {
              connectionString: '',
            },
          },
        });
        expect.fail('Expected connection string to be required.');
      } catch (e) {
        expect(e).to.have.property(
          'message',
          'Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://"'
        );
      }
    });

    context('it stores all the fleOptions on disk', function () {
      it('removes secrets when storeCredentials is false', async function () {
        const id = new UUID().toString();
        const connectionInfo = {
          id,
          connectionOptions: {
            connectionString: 'mongodb://localhost:27017/',
            fleOptions: {
              storeCredentials: false,
              autoEncryption: {
                keyVaultNamespace: 'db.coll',
                kmsProviders: {
                  local: {
                    key: 'my-key',
                  },
                  'local:2': {
                    key: 'my-key-2',
                  },
                  kmip: {
                    endpoint: 'kmip://localhost:5696',
                  },
                },
              },
            },
          },
        };

        // Stub encryptSecrets so that we do not call electron.safeStorage.encrypt
        // and make assertions on that.
        const encryptSecretsStub = Sinon.stub(
          connectionStorage,
          'encryptSecrets' as any
        ).returns(undefined);

        await connectionStorage.save({ connectionInfo });

        const expectedConnection = await readConnection(tmpDir, id);
        connectionInfo.connectionOptions.fleOptions.autoEncryption.kmsProviders =
          {
            kmip: {
              endpoint: 'kmip://localhost:5696',
            },
          } as any;
        expect(expectedConnection).to.deep.equal({
          _id: connectionInfo.id,
          connectionInfo,
          version: 1,
        });

        expect(encryptSecretsStub.calledOnce).to.be.true;
        expect(
          encryptSecretsStub.firstCall.firstArg,
          'it should not store any secrets'
        ).to.deep.equal({});
      });

      it('encrypt and store secrets when storeCredentials is true', async function () {
        const id = new UUID().toString();
        const connectionInfo = {
          id,
          connectionOptions: {
            connectionString: 'mongodb://localhost:27017/',
            fleOptions: {
              storeCredentials: true,
              autoEncryption: {
                keyVaultNamespace: 'db.coll',
                kmsProviders: {
                  local: {
                    key: 'my-key',
                  },
                  'local:2': {
                    key: 'my-key-2',
                  },
                  kmip: {
                    endpoint: 'kmip://localhost:5696',
                  },
                },
              },
            },
          },
        };

        // Stub encryptSecrets so that we do not call electron.safeStorage.encrypt
        // and make assertions on that.
        const encryptSecretsStub = Sinon.stub(
          connectionStorage,
          'encryptSecrets' as any
        ).returns('encrypted-data');

        await connectionStorage.save({ connectionInfo });

        const expectedConnection = await readConnection(tmpDir, id);
        connectionInfo.connectionOptions.fleOptions.autoEncryption.kmsProviders =
          {
            kmip: {
              endpoint: 'kmip://localhost:5696',
            },
          } as any;
        expect(expectedConnection).to.deep.equal({
          _id: connectionInfo.id,
          connectionInfo,
          connectionSecrets: 'encrypted-data',
          version: 1,
        });

        expect(encryptSecretsStub.calledOnce).to.be.true;
        expect(
          encryptSecretsStub.firstCall.firstArg,
          'it should store secrets'
        ).to.deep.equal({
          autoEncryption: {
            kmsProviders: {
              local: {
                key: 'my-key',
              },
              'local:2': {
                key: 'my-key-2',
              },
            },
          },
        });
      });
    });

    it('saves a connection with _id', async function () {
      const id = new UUID().toString();
      try {
        await fs.access(getConnectionFilePath(tmpDir, id));
      } catch (e) {
        expect(e).to.be.instanceOf(Error);
      }

      // Stub encryptSecrets so that we do not call electron.safeStorage.encrypt
      // and make assertions on that.
      const encryptSecretsStub = Sinon.stub(
        connectionStorage,
        'encryptSecrets' as any
      ).returns('encrypted-password');

      await connectionStorage.save({
        connectionInfo: {
          id,
          connectionOptions: {
            connectionString: 'mongodb://root:password@localhost:27017',
          },
        },
      });

      const savedConnection = await readConnection(tmpDir, id);
      expect(savedConnection).to.deep.equal({
        connectionInfo: {
          id,
          connectionOptions: {
            connectionString: 'mongodb://root@localhost:27017/',
          },
        },
        connectionSecrets: 'encrypted-password',
        version: 1,
        _id: id,
      });

      expect(encryptSecretsStub.calledOnce).to.be.true;
      expect(
        encryptSecretsStub.firstCall.firstArg,
        'it encrypts the connection secrets correctly'
      ).to.deep.equal({ password: 'password' });
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

        const deleteSpy = Sinon.spy(connectionStorage, 'delete');

        // Save another connection
        await connectionStorage.save({ connectionInfo: getConnectionInfo() });

        const numConnections = (await connectionStorage.loadAll()).length;
        expect(numConnections).to.equal(maxAllowedConnections);

        expect(
          deleteSpy.calledOnceWithExactly({
            id: connectionInfos[connectionInfos.length - 1].id,
          })
        ).to.be.true;
      });

      it('does not remove recent if recent connections are less then max allowed connections', async function () {
        await createNumberOfConnections(maxAllowedConnections - 1);

        const deleteSpy = Sinon.spy(connectionStorage, 'delete');

        // Save another connection
        await connectionStorage.save({ connectionInfo: getConnectionInfo() });

        const numConnections = (await connectionStorage.loadAll()).length;
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

      await connectionStorage.delete({ id: connectionInfo.id });

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
        await connectionStorage.getLegacyConnections();
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
        await connectionStorage.getLegacyConnections();
      expect(getLegacyConnections).to.have.lengthOf(0);
    });

    it('returns true if there are favorite legacy connections', async function () {
      // Write a legacy connection (connection without connectionInfo, which is favorite and has a name)
      await writeFakeConnection(tmpDir, {
        _id: new UUID().toString(),
        isFavorite: true,
        name: 'Local 1',
      });
      const getLegacyConnections =
        await connectionStorage.getLegacyConnections();
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
        savedConnectionType: 'favorite',
      }),
      getConnectionInfo({
        favorite: {
          name: 'Connection 2',
        },
        savedConnectionType: 'favorite',
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
      const exportedConnections = await connectionStorage.exportConnections();
      const parsedConnections = JSON.parse(exportedConnections);

      const connectionNames = parsedConnections.connections.map(
        (x: ConnectionInfo) => x.favorite?.name
      );

      expect(parsedConnections.connections).to.have.lengthOf(2);
      expect(connectionNames.includes('Connection 1')).to.be.true;
      expect(connectionNames.includes('Connection 2')).to.be.true;
    });

    it('exports connections with filter', async function () {
      const exportedConnections = await connectionStorage.exportConnections({
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
      const exportedConnections = await connectionStorage.exportConnections();

      // now remove connections
      await Promise.all(
        CONNECTIONS.map(({ id }) => connectionStorage.delete({ id }))
      );

      await connectionStorage.importConnections({
        content: exportedConnections,
      });

      const expectedConnections = await connectionStorage.loadAll();

      expect(sortBy(expectedConnections, 'id')).to.deep.equal(
        sortBy(CONNECTIONS, 'id')
      );
    });

    it('imports connections with filter', async function () {
      const exportedConnections = await connectionStorage.exportConnections();

      // now remove connections
      await Promise.all(
        CONNECTIONS.map(({ id }) => connectionStorage.delete({ id }))
      );

      await connectionStorage.importConnections({
        content: exportedConnections,
        options: {
          filterConnectionIds: [CONNECTIONS[1].id],
        },
      });

      const expectedConnections = await connectionStorage.loadAll();
      expect(expectedConnections).to.deep.equal([CONNECTIONS[1]]);
    });
  });

  describe('supports connections from older version of compass', function () {
    it('correctly identifies connection as legacy connection', async function () {
      await writeFakeConnection(tmpDir, connection1270);
      const expectedConnection = await connectionStorage.load({
        id: connection1270._id,
      });
      expect(expectedConnection).to.be.undefined;

      const legacyConnections = await connectionStorage.getLegacyConnections();
      expect(legacyConnections).to.deep.equal([{ name: connection1270.name }]);
    });

    it(`maps connectons with legacy props and connection info to just connection info`, async function () {
      const connections = {
        '1.31.0': connection1310,
        '1.38.0': connection1380,
      } as any;

      for (const version in connections) {
        const connection = connections[version];
        await writeFakeConnection(tmpDir, connection);
        const expectedConnection = await connectionStorage.load({
          id: connection._id,
        });

        expect(expectedConnection, version).to.not.be.undefined;

        // Converts a legacy connection to new connectionInfo
        expect(Object.keys(expectedConnection!)).to.deep.equal([
          'id',
          'lastUsed',
          'favorite',
          'connectionOptions',
          'savedConnectionType',
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

  describe('getAutoConnectInfo', function () {
    const autoConnectInfo: ConnectionInfo = {
      id: new UUID().toString(),
      connectionOptions: {
        connectionString: 'mongodb://localhost:2021/',
      },
      favorite: {
        name: 'AutoConnect',
      },
    };
    beforeEach(async function () {
      Sinon.stub(connectionStorage, 'loadAll').resolves([autoConnectInfo]);
      await writeExportedConnectionsFile(
        tmpDir,
        await connectionStorage.exportConnections()
      );

      Sinon.restore();
      const connectionInfo = getConnectionInfo({ lastUsed: new Date() });
      await writeFakeConnection(tmpDir, { connectionInfo });
    });

    it('should return autoConnectInfo when a file is provided', async function () {
      const info = await connectionStorage.getAutoConnectInfo({
        shouldAutoConnect: true,
        file: getExportedConnectionsFilePath(tmpDir),
      });
      expect(info?.id).to.equal(autoConnectInfo.id);
      expect(info?.connectionOptions).to.deep.equal(
        autoConnectInfo.connectionOptions
      );
    });

    it('should return autoConnectInfo when a file with positional argument is provided', async function () {
      const info = await connectionStorage.getAutoConnectInfo({
        shouldAutoConnect: true,
        file: getExportedConnectionsFilePath(tmpDir),
        positionalArguments: [autoConnectInfo.id],
      });
      expect(info?.id).to.equal(autoConnectInfo.id);
      expect(info?.connectionOptions).to.deep.equal(
        autoConnectInfo.connectionOptions
      );
    });

    it('should return autoConnectInfo when a mongodb url is provided', async function () {
      const info = await connectionStorage.getAutoConnectInfo({
        shouldAutoConnect: true,
        positionalArguments: ['mongodb://localhost:2021/'],
      });
      expect(info?.connectionOptions.connectionString).to.equal(
        'mongodb://localhost:2021/'
      );
    });

    context('when autoConnectInfo is available', function () {
      beforeEach(async function () {
        await connectionStorage.getAutoConnectInfo({
          shouldAutoConnect: true,
          file: getExportedConnectionsFilePath(tmpDir),
        });
      });

      it('save ignores the call when the passed connectionInfo matches autoConnectInfo', async function () {
        await connectionStorage.save({
          connectionInfo: {
            ...autoConnectInfo,
            connectionOptions: {
              connectionString: 'mongodb://localhost:2020/',
            },
          },
        });

        try {
          await readConnection(tmpDir, autoConnectInfo.id);
          expect.fail(
            'Did not expect auto connect info to be saved but it was'
          );
        } catch (error) {
          //
        }
      });
    });
  });
});
