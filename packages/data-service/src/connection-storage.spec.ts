// eslint-disable-next-line @typescript-eslint/no-var-requires
const { TestBackend } = require('storage-mixin');

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

  describe('import/export', function () {
    it('does not encrypt connections if without password', async function () {
      const id = uuid();
      const connectionStorage = new ConnectionStorage();
      const targetPath = path.join(tmpDir, `export-${id}.json`);
      await connectionStorage.export(
        [
          {
            id,
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
          },
        ],
        targetPath,
        {}
      );

      const raw = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
      expect(raw.version).to.equal(1);
      expect(raw.encrypted).to.equal(false);
      expect(raw.connections).to.deep.equal([
        {
          id,
          connectionOptions: {
            connectionString: 'mongodb://localhost:27017',
          },
        },
      ]);
    });

    it('encrypts connections with password', async function () {
      const id = uuid();
      const connectionStorage = new ConnectionStorage();
      const targetPath = path.join(tmpDir, `export-${id}.json`);
      await connectionStorage.export(
        [
          {
            id,
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
          },
        ],
        targetPath,
        { encryptionPassword: 'mypassword' }
      );

      const raw = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
      expect(raw.version).to.equal(1);
      expect(raw.encrypted).to.equal(true);
      expect(Array.isArray(raw.connections)).to.be.false;
    });

    it('imports a non encrypted file', async function () {
      const id = uuid();
      const connectionStorage = new ConnectionStorage();
      const targetPath = path.join(tmpDir, `export-${id}.json`);
      await connectionStorage.export(
        [
          {
            id,
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
          },
        ],
        targetPath,
        {}
      );

      expect(await connectionStorage.import(targetPath, {})).to.deep.equal([
        {
          id,
          connectionOptions: {
            connectionString: 'mongodb://localhost:27017',
          },
        },
      ]);
    });

    it('imports an encrypted file', async function () {
      const id = uuid();
      const connectionStorage = new ConnectionStorage();
      const targetPath = path.join(tmpDir, `export-${id}.json`);
      await connectionStorage.export(
        [
          {
            id,
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
            lastUsed: new Date('2021-12-09T17:55:06.442Z'),
          },
        ],
        targetPath,
        { encryptionPassword: 'mypassword' }
      );

      expect(
        await connectionStorage.import(targetPath, {
          encryptionPassword: 'mypassword',
        })
      ).to.deep.equal([
        {
          id,
          connectionOptions: {
            connectionString: 'mongodb://localhost:27017',
          },
          lastUsed: new Date('2021-12-09T17:55:06.442Z'),
        },
      ]);
    });

    it('throws importing an encrypted file without password', async function () {
      const id = uuid();
      const connectionStorage = new ConnectionStorage();
      const targetPath = path.join(tmpDir, `export-${id}.json`);
      await connectionStorage.export(
        [
          {
            id,
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
          },
        ],
        targetPath,
        { encryptionPassword: 'mypassword' }
      );

      const error = await connectionStorage
        .import(targetPath, {
          encryptionPassword: '',
        })
        .catch((err) => err);

      expect(error.message).to.equal(
        'A password is required to read connections from an encrypted file.'
      );
    });

    it('throws with wrong password', async function () {
      const id = uuid();
      const connectionStorage = new ConnectionStorage();
      const targetPath = path.join(tmpDir, `export-${id}.json`);
      await connectionStorage.export(
        [
          {
            id,
            connectionOptions: {
              connectionString: 'mongodb://localhost:27017',
            },
          },
        ],
        targetPath,
        { encryptionPassword: 'mypassword' }
      );

      const error = await connectionStorage
        .import(targetPath, {
          encryptionPassword: 'wrongpassword',
        })
        .catch((err) => err);

      expect(error.message).to.equal('Error decrypting connection data.');
    });
  });
});
