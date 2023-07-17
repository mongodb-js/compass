// eslint-disable-next-line @typescript-eslint/no-var-requires
const { TestBackend } = require('storage-mixin');

import { expect } from 'chai';

import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuid } from 'uuid';

import { ConnectionStorage } from './connection-storage';
import type { ConnectionInfo } from './connection-info';

async function eventually(
  fn: () => void | Promise<void>,
  opts: { frequency?: number; timeout?: number } = {}
): Promise<void> {
  const options = {
    frequency: 100,
    timeout: 2000,
    ...opts,
  };

  let attempts = Math.round(options.timeout / options.frequency);
  let err: Error = new Error('Timed out');

  while (attempts) {
    attempts--;

    try {
      await fn();
      return;
    } catch (e) {
      err = e as Error;
    }

    await new Promise((resolve) => setTimeout(resolve, options.frequency));
  }

  Object.assign(err, {
    message: `Timed out ${options.timeout}: ${err.message}`,
    timedOut: true,
    timeout: options.timeout,
  });

  throw err;
}

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
    TestBackend.enable(tmpDir);
    connectionStorage = new ConnectionStorage(tmpDir);
  });

  afterEach(function () {
    TestBackend.disable();
    fs.rmdirSync(tmpDir, { recursive: true });
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

      await connectionStorage.save({
        id,
        connectionOptions: {
          connectionString: 'mongodb://localhost:27017',
        },
      });

      await eventually(() => {
        expect(
          JSON.parse(
            fs.readFileSync(getConnectionFilePath(tmpDir, id), 'utf-8')
          )._id
        ).to.be.equal(id);
      });
    });

    it('attempts to preserve old model properties', async function () {
      const id: string = uuid();
      expect(fs.existsSync(getConnectionFilePath(tmpDir, id))).to.be.false;

      await connectionStorage.save({
        id,
        favorite: {
          name: 'Favorite',
        },
        connectionOptions: {
          connectionString: 'mongodb://localhost:27017?ssl=true',
        },
      });

      await eventually(() => {
        const { isFavorite, sslMethod, name } = JSON.parse(
          fs.readFileSync(getConnectionFilePath(tmpDir, id), 'utf-8')
        );

        expect({ isFavorite, sslMethod, name }).to.deep.equal({
          isFavorite: true,
          name: 'Favorite',
          sslMethod: 'SYSTEMCA',
        });
      });
    });

    it('saves a connection with arbitrary authMechanism (bypass Ampersand validations)', async function () {
      const id: string = uuid();
      await connectionStorage.save({
        id,
        connectionOptions: {
          connectionString: 'mongodb://localhost:27017?authMechanism=FAKEAUTH',
        },
      });

      await eventually(() => {
        expect(
          JSON.parse(
            fs.readFileSync(getConnectionFilePath(tmpDir, id), 'utf-8')
          ).connectionInfo?.connectionOptions?.connectionString
        ).to.be.equal('mongodb://localhost:27017/?authMechanism=FAKEAUTH');
      });
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

    it('does not save fle secrets if fleOptions.storeCredentials is false', async function () {
      const id = uuid();
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

      await eventually(() => {
        const { secrets, connectionInfo } = JSON.parse(
          fs.readFileSync(getConnectionFilePath(tmpDir, id), 'utf-8')
        );

        expect(connectionInfo.connectionOptions.fleOptions).to.deep.equal({
          storeCredentials: false,
          autoEncryption: {
            keyVaultNamespace: 'db.coll',
            kmsProviders: {},
          },
        });

        // NOTE: this would be available in the file only during tests cause
        // we disable extracting secrets to keytar
        expect(secrets.autoEncryption).to.be.undefined;
      });
    });

    it('saves fle secrets if fleOptions.storeCredentials is true', async function () {
      const id = uuid();
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

      await eventually(() => {
        const { secrets, connectionInfo } = JSON.parse(
          fs.readFileSync(getConnectionFilePath(tmpDir, id), 'utf-8')
        );

        expect(connectionInfo.connectionOptions.fleOptions).to.deep.equal({
          storeCredentials: true,
          autoEncryption: {
            keyVaultNamespace: 'db.coll',
            kmsProviders: {},
          },
        });

        // NOTE: this is available in the file only during tests cause
        // we disable extracting secrets to keytar
        expect(secrets.autoEncryption).to.deep.equal({
          kmsProviders: {
            local: {
              key: 'my-key',
            },
          },
        });
      });
    });

    it('does not trigger old connection-model validations', async function () {
      const id = uuid();
      await connectionStorage.save({
        id,
        connectionOptions: {
          connectionString:
            'mongodb://localhost:27017/?tls=true&tlsCertificateKeyFile=%2FUsers%2Fmaurizio%2FDownloads%2FX509-cert-2577072670755779500.pem',
        },
      });

      await eventually(() => {
        const { connectionInfo } = JSON.parse(
          fs.readFileSync(getConnectionFilePath(tmpDir, id), 'utf-8')
        );

        expect(connectionInfo).to.deep.equal({
          id,
          connectionOptions: {
            connectionString:
              'mongodb://localhost:27017/?tls=true&tlsCertificateKeyFile=%2FUsers%2Fmaurizio%2FDownloads%2FX509-cert-2577072670755779500.pem',
          },
        });
      });
    });
  });

  describe('destroy', function () {
    it('removes a model', async function () {
      const connectionInfo = getConnectionInfo();
      writeFakeConnection(tmpDir, {
        connectionInfo,
      });

      expect(fs.existsSync(getConnectionFilePath(tmpDir, connectionInfo.id))).to
        .be.true;

      await connectionStorage.delete(connectionInfo.id);

      await eventually(() => {
        const filePath = getConnectionFilePath(tmpDir, connectionInfo.id);
        expect(fs.existsSync(filePath)).to.be.false;
      });
    });
  });
});
