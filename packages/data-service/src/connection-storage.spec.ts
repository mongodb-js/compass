// eslint-disable-next-line @typescript-eslint/no-var-requires
const { TestBackend } = require('storage-mixin');

import { expect } from 'chai';

import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuid } from 'uuid';

import { ConnectionStorage } from './connection-storage';
import type { LegacyConnectionModel } from './legacy/legacy-connection-model';

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
      err = e;
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

function writeFakeConnection(
  tmpDir: string,
  legacyConnection: Partial<LegacyConnectionModel> & { _id: string }
) {
  const filePath = getConnectionFilePath(tmpDir, legacyConnection._id);
  const connectionsDir = path.dirname(filePath);
  fs.mkdirSync(connectionsDir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(legacyConnection));
}

describe('ConnectionStorage', function () {
  let tmpDir: string;
  beforeEach(function () {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'connection-storage-tests'));
    TestBackend.enable(tmpDir);
  });

  afterEach(function () {
    TestBackend.disable();
    fs.rmdirSync(tmpDir, { recursive: true });
  });

  describe('loadAll', function () {
    it('should load an empty array with no connections', async function () {
      const connectionStorage = new ConnectionStorage();
      const connections = await connectionStorage.loadAll();
      expect(connections).to.deep.equal([]);
    });

    it('should return an array of saved connections', async function () {
      const id = uuid();
      writeFakeConnection(tmpDir, { _id: id });
      const connectionStorage = new ConnectionStorage();
      const connections = await connectionStorage.loadAll();
      expect(connections).to.deep.equal([
        {
          id,
          connectionOptions: {
            connectionString:
              'mongodb://localhost:27017/?readPreference=primary&ssl=false',
          },
        },
      ]);
    });

    it('should ignore failures in conversion', async function () {
      const id1 = uuid();
      const id2 = uuid();
      writeFakeConnection(tmpDir, {
        _id: id1,
        connectionInfo: {
          id: id1,
          connectionOptions: {
            connectionString: '',
          },
        },
      });

      writeFakeConnection(tmpDir, {
        _id: id2,
        connectionInfo: {
          id: id2,
          connectionOptions: {
            connectionString:
              'mongodb://localhost:27020/?readPreference=primary&ssl=false',
          },
        },
      });
      const connectionStorage = new ConnectionStorage();
      const connections = await connectionStorage.loadAll();
      expect(connections).to.deep.equal([
        {
          id: id2,
          connectionOptions: {
            connectionString:
              'mongodb://localhost:27020/?readPreference=primary&ssl=false',
          },
        },
      ]);
    });

    it('should convert lastUsed', async function () {
      const id = uuid();
      const lastUsed = new Date('2021-10-26T13:51:27.585Z');
      writeFakeConnection(tmpDir, {
        _id: id,
        lastUsed,
      });

      const connectionStorage = new ConnectionStorage();
      const connections = await connectionStorage.loadAll();
      expect(connections[0].lastUsed).to.deep.equal(lastUsed);
    });
  });

  describe('load', function () {
    it('should return undefined if id is undefined', async function () {
      const connectionStorage = new ConnectionStorage();
      expect(await connectionStorage.load(undefined)).to.be.undefined;
      expect(await connectionStorage.load('')).to.be.undefined;
    });

    it('should return undefined if a connection does not exist', async function () {
      const connectionStorage = new ConnectionStorage();
      const connection = await connectionStorage.load('note-exis-stin-gone');
      expect(connection).to.be.undefined;
    });

    it('should return an existing connection', async function () {
      const id = uuid();
      writeFakeConnection(tmpDir, { _id: id });
      const connectionStorage = new ConnectionStorage();
      const connection = await connectionStorage.load(id);
      expect(connection).to.deep.equal({
        id,
        connectionOptions: {
          connectionString:
            'mongodb://localhost:27017/?readPreference=primary&ssl=false',
        },
      });
    });

    it('should convert lastUsed', async function () {
      const id = uuid();
      const lastUsed = new Date('2021-10-26T13:51:27.585Z');
      writeFakeConnection(tmpDir, {
        _id: id,
        lastUsed,
      });

      const connectionStorage = new ConnectionStorage();
      const connection = await connectionStorage.load(id);
      expect(connection.lastUsed).to.deep.equal(lastUsed);
    });
  });

  describe('save', function () {
    it('saves a valid connection object', async function () {
      const id: string = uuid();
      expect(fs.existsSync(getConnectionFilePath(tmpDir, id))).to.be.false;

      const connectionStorage = new ConnectionStorage();
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

      const connectionStorage = new ConnectionStorage();
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
      const connectionStorage = new ConnectionStorage();
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
      const connectionStorage = new ConnectionStorage();
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
      const connectionStorage = new ConnectionStorage();
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
  });

  describe('destroy', function () {
    it('removes a model', async function () {
      const id: string = uuid();
      writeFakeConnection(tmpDir, { _id: id });

      expect(fs.existsSync(getConnectionFilePath(tmpDir, id))).to.be.true;

      const connectionStorage = new ConnectionStorage();
      await connectionStorage.delete({
        id,
        connectionOptions: {
          connectionString: 'mongodb://localhost:27017',
        },
      });

      await eventually(() => {
        const filePath = getConnectionFilePath(tmpDir, id);
        expect(fs.existsSync(filePath)).to.be.false;
      });
    });
  });
});
