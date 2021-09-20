import { TestBackend } from 'storage-mixin';

import { expect } from 'chai';

import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuid } from 'uuid';

import { ConnectionStorage } from './connection-storage';
import { LegacyConnectionModel } from './legacy/legacy-connection-model';

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

  describe('load', function () {
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
