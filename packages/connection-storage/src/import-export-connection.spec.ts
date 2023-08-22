import {
  serializeConnections,
  deserializeConnections,
} from './import-export-connection';
import { expect } from 'chai';
import type { ConnectionInfo } from './connection-info';
import { cloneDeep } from 'lodash';

const CONNECTIONS: ConnectionInfo[] = [
  {
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
  },
  {
    id: 'id2',
    lastUsed: new Date('2022-09-07T15:12:55.253Z'),
    favorite: { name: 'fave two' },
    connectionOptions: {
      connectionString: 'mongodb://user:pass@mongodb.net/',
    },
  },
];

describe('Connection serialization', function () {
  it('with default options', async function () {
    const serializedConnections = await serializeConnections(CONNECTIONS);
    expect(await deserializeConnections(serializedConnections)).to.deep.equal(
      CONNECTIONS
    );
  });

  it('without secrets', async function () {
    const serializedConnections = await serializeConnections(CONNECTIONS, {
      removeSecrets: true,
    });

    const expected = await deserializeConnections(serializedConnections);

    const connectionsWithoutSecrets = cloneDeep(CONNECTIONS);
    for (const info of connectionsWithoutSecrets) {
      info.connectionOptions.connectionString =
        info.connectionOptions.connectionString.replace(/:pass/, '');
      delete info.connectionOptions.sshTunnel?.password;
    }
    expect(expected).to.deep.equal(connectionsWithoutSecrets);
  });

  it('with a passphrase', async function () {
    const serializedConnections = await serializeConnections(CONNECTIONS, {
      passphrase: 'p4ssw0rd',
    });

    expect(
      JSON.parse(serializedConnections).connections[0].connectionSecrets
    ).to.be.a('string');
    expect(
      JSON.parse(serializedConnections).connections[1].connectionSecrets
    ).to.be.a('string');

    const expected = await deserializeConnections(serializedConnections, {
      passphrase: 'p4ssw0rd',
    });
    expect(expected).to.deep.equal(CONNECTIONS);
  });

  it('rejects invalid JSON input', async function () {
    try {
      await deserializeConnections('sakljdhf', {});
      expect.fail('missed exception');
    } catch (err) {
      expect((err as Error).message).to.include(
        'Could not parse connections list'
      );
    }
  });

  it('rejects files with a different type attribute', async function () {
    try {
      await deserializeConnections('{"type":"Not A Connection List"}', {});
      expect.fail('missed exception');
    } catch (err) {
      expect((err as Error).message).to.include(
        'Input is in unrecognized format (expected Compass import file)'
      );
    }
  });

  it('rejects files with a different version attribute', async function () {
    try {
      await deserializeConnections(
        '{"type":"Compass Connections","version":123456}'
      );
      expect.fail('missed exception');
    } catch (err) {
      expect((err as Error).message).to.include(
        'Input is in unrecognized format (expected version 1, got 123456)'
      );
    }
  });

  it('rejects files with secrets when password is missing', async function () {
    const serializedConnections = await serializeConnections(CONNECTIONS, {
      passphrase: 'p4ssw0rd',
    });

    try {
      await deserializeConnections(serializedConnections);
      expect.fail('missed exception');
    } catch (err) {
      expect((err as Error).message).to.include(
        'Input file contains encrypted secrets but no passphrase was provided'
      );
      expect((err as any).passphraseRequired).to.equal(true);
    }
  });

  it('rejects files with tampered secrets', async function () {
    const serializedConnections = await serializeConnections(CONNECTIONS, {
      passphrase: 'p4ssw0rd',
    });
    const tampered = JSON.parse(serializedConnections);
    tampered.connections[0].connectionSecrets += 'asdf';
    try {
      await deserializeConnections(JSON.stringify(tampered), {
        passphrase: 'p4ssw0rd',
      });
      expect.fail('missed exception');
    } catch (err) {
      expect((err as Error).message).to.include(
        'Cannot decrypt due to corrupt data or wrong passphrase'
      );
    }
  });

  it('rejects importing when the passphrase is incorrect', async function () {
    const serializedConnections = await serializeConnections(CONNECTIONS, {
      passphrase: 'p4ssw0rd',
    });
    try {
      await deserializeConnections(serializedConnections, {
        passphrase: 'wr0ng_p4ssw0rd!',
      });
      expect.fail('missed exception');
    } catch (err) {
      expect((err as Error).message).to.include(
        'Cannot decrypt due to corrupt data or wrong passphrase'
      );
    }
  });
});
