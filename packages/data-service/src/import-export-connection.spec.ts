// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  exportConnections,
  importConnections,
} from './import-export-connection';
import { expect } from 'chai';
import type { ConnectionInfo } from './connection-info';
import { cloneDeep } from 'lodash';

class MockConnectionStorage {
  storage: ConnectionInfo[] = [];

  // eslint-disable-next-line @typescript-eslint/require-await
  async save(connectionInfo: ConnectionInfo): Promise<void> {
    this.storage = [
      ...this.storage.filter((info) => info.id !== connectionInfo.id),
      connectionInfo,
    ];
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async loadAll(): Promise<ConnectionInfo[]> {
    return [...this.storage];
  }
}

describe('Connection export/import', function () {
  let outStorage: MockConnectionStorage;
  let inStorage: MockConnectionStorage;

  beforeEach(async function () {
    outStorage = new MockConnectionStorage();
    inStorage = new MockConnectionStorage();
    await inStorage.save({
      id: 'id1',
      lastUsed: new Date('2022-09-07T15:12:55.253Z'),
      favorite: { name: 'fave one' },
      connectionOptions: {
        connectionString: 'mongodb://user:pass@localhost:12345/',
        sshTunnel: {
          host: 'mongodb.net',
          port: 22,
          username: 'AzureDiamond',
          password: 'hunter2',
        },
      },
    });
    await inStorage.save({
      id: 'id2',
      lastUsed: new Date('2022-09-07T15:12:55.253Z'),
      favorite: { name: 'fave two' },
      connectionOptions: {
        connectionString: 'mongodb://user:pass@mongodb.net/',
      },
    });
  });

  it('can export and import connections with default options', async function () {
    const exported = await exportConnections({
      storage: inStorage,
    });
    await importConnections(exported, {
      storage: outStorage,
    });
    expect(await outStorage.loadAll()).to.have.lengthOf(2);
    expect(await outStorage.loadAll()).to.deep.equal(await inStorage.loadAll());
  });

  it('can export and import connections without secrets', async function () {
    const exported = await exportConnections({
      storage: inStorage,
      removeSecrets: true,
    });
    await importConnections(exported, {
      storage: outStorage,
    });
    expect(await outStorage.loadAll()).to.have.lengthOf(2);
    const expected = cloneDeep(await inStorage.loadAll());
    for (const info of expected) {
      info.connectionOptions.connectionString =
        info.connectionOptions.connectionString.replace(/:pass/, '');
      delete info.connectionOptions.sshTunnel?.password;
    }
    expect(await outStorage.loadAll()).to.deep.equal(expected);
  });

  it('can export and import connections with a passphrase', async function () {
    const exported = await exportConnections({
      storage: inStorage,
      passphrase: 'p4ssw0rd',
    });
    await importConnections(exported, {
      storage: outStorage,
      passphrase: 'p4ssw0rd',
    });
    expect(JSON.parse(exported).connections[0].connectionSecrets).to.be.a(
      'string'
    );
    expect(JSON.parse(exported).connections[1].connectionSecrets).to.be.a(
      'string'
    );
    expect(await outStorage.loadAll()).to.have.lengthOf(2);
    expect(await outStorage.loadAll()).to.deep.equal(await inStorage.loadAll());
  });

  it('can export and import connections with an export filter', async function () {
    const exported = await exportConnections({
      storage: inStorage,
      passphrase: 'p4ssw0rd',
      filter: (info) => info.id === 'id1',
    });
    await importConnections(exported, {
      storage: outStorage,
      passphrase: 'p4ssw0rd',
    });
    expect(await outStorage.loadAll()).to.have.lengthOf(1);
    expect(await outStorage.loadAll()).to.deep.equal([
      (await inStorage.loadAll())[0],
    ]);
  });

  it('can export and import connections with an import filter', async function () {
    const exported = await exportConnections({
      storage: inStorage,
      passphrase: 'p4ssw0rd',
    });
    await importConnections(exported, {
      storage: outStorage,
      passphrase: 'p4ssw0rd',
      filter: (info) => info.id === 'id1',
    });
    expect(await outStorage.loadAll()).to.have.lengthOf(1);
    expect(await outStorage.loadAll()).to.deep.equal([
      (await inStorage.loadAll())[0],
    ]);
  });

  it('rejects invalid JSON input', async function () {
    try {
      await importConnections('sakljdhf', { storage: outStorage });
      expect.fail('missed exception');
    } catch (err) {
      expect(err.message).to.include('Could not parse connections list');
    }
  });

  it('rejects files with a different type attribute', async function () {
    try {
      await importConnections('{"type":"Not A Connection List"}', {
        storage: outStorage,
      });
      expect.fail('missed exception');
    } catch (err) {
      expect(err.message).to.include(
        'Input is in unrecognized format (expected Compass import file)'
      );
    }
  });

  it('rejects files with a different version attribute', async function () {
    try {
      await importConnections(
        '{"type":"Compass Connections","version":123456}',
        { storage: outStorage }
      );
      expect.fail('missed exception');
    } catch (err) {
      expect(err.message).to.include(
        'Input is in unrecognized format (expected version 1, got 123456)'
      );
    }
  });

  it('rejects files with secrets when password is missing', async function () {
    const exported = await exportConnections({
      storage: inStorage,
      passphrase: 'p4ssw0rd',
    });

    try {
      await importConnections(exported, {
        storage: outStorage,
      });
      expect.fail('missed exception');
    } catch (err) {
      expect(err.message).to.include(
        'Input file contains encrypted secrets but no passphrase was provided'
      );
    }
  });

  it('rejects files with tampered secrets', async function () {
    const exported = await exportConnections({
      storage: inStorage,
      passphrase: 'p4ssw0rd',
    });
    const tampered = JSON.parse(exported);
    tampered.connections[0].connectionSecrets += 'asdf';
    try {
      await importConnections(JSON.stringify(tampered), {
        storage: outStorage,
        passphrase: 'p4ssw0rd',
      });
      expect.fail('missed exception');
    } catch (err) {
      expect(err.message).to.include(
        'Cannot decrypt due to corrupt data or wrong passphrase'
      );
    }
  });
});
