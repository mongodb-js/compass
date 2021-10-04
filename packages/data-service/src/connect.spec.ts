import createTestEnvs from '@mongodb-js/devtools-docker-test-envs';
import { expect } from 'chai';
import util from 'util';
import connect from './connect';
import { ConnectionOptions } from './connection-options';
import DataService from './data-service';

const envs = createTestEnvs([
  'enterprise',
  'ldap',
  'scram',
  'sharded',
  'ssh',
  'tls',
  // 'kerberos',
  // 'replicaSet',
]);

const shouldRunConnectivityTests = () =>
  process.env.COMPASS_RUN_CONNECTIVITY_TESTS === 'true' ||
  process.env.EVERGREEN_BUILD_VARIANT === 'ubuntu' ||
  (process.env.CI === 'true' && process.env.RUNNER_OS === 'Linux');

const SETUP_TEARDOWN_TIMEOUT = 10 * 60 * 1000; // 10 minutes

describe('connect', function () {
  before(async function () {
    this.timeout(SETUP_TEARDOWN_TIMEOUT);

    if (!shouldRunConnectivityTests()) {
      return this.skip();
    }

    try {
      await envs.setup();
    } catch (e) {
      await envs.teardown();
      throw e;
    }
  });

  after(async function () {
    this.timeout(SETUP_TEARDOWN_TIMEOUT);

    if (!shouldRunConnectivityTests()) {
      return;
    }

    await envs.teardown();
  });

  it('Can connect to an enterprise server', async function () {
    await testConnection(envs.getConnectionOptions('enterprise'), {
      authenticatedUserRoles: [],
      authenticatedUsers: [],
    });
  });

  describe('ldap', function () {
    it('Can connect with ldap', async function () {
      await testConnection(envs.getConnectionOptions('ldap'), {
        authenticatedUserRoles: [
          {
            db: 'admin',
            role: 'readWriteAnyDatabase',
          },
        ],
        authenticatedUsers: [
          {
            db: '$external',
            user: 'writer@EXAMPLE.COM',
          },
        ],
      });
    });
  });

  describe('scram', function () {
    it('Connects with scram (scramReadWriteAnyDatabase)', async function () {
      await testConnection(
        envs.getConnectionOptions('scramReadWriteAnyDatabase'),
        {
          authenticatedUserRoles: [
            {
              db: 'admin',
              role: 'readWriteAnyDatabase',
            },
          ],
          authenticatedUsers: [
            {
              db: 'admin',
              user: 'user1',
            },
          ],
        }
      );
    });

    it('Connects with scram (scramReadWriteAnyDatabaseScramSha1)', async function () {
      await testConnection(
        envs.getConnectionOptions('scramReadWriteAnyDatabaseScramSha1'),
        {
          authenticatedUserRoles: [
            {
              db: 'admin',
              role: 'readWriteAnyDatabase',
            },
          ],
          authenticatedUsers: [
            {
              db: 'admin',
              user: 'user1',
            },
          ],
        }
      );
    });

    it('Connects with scram (scramReadWriteAnyDatabaseScramSha256)', async function () {
      await testConnection(
        envs.getConnectionOptions('scramReadWriteAnyDatabaseScramSha256'),
        {
          authenticatedUserRoles: [
            {
              db: 'admin',
              role: 'readWriteAnyDatabase',
            },
          ],
          authenticatedUsers: [
            {
              db: 'admin',
              user: 'user1',
            },
          ],
        }
      );
    });

    it('Connects with scram (scramOnlyScramSha1)', async function () {
      await testConnection(envs.getConnectionOptions('scramOnlyScramSha1'), {
        authenticatedUserRoles: [
          {
            db: 'admin',
            role: 'readWriteAnyDatabase',
          },
        ],
        authenticatedUsers: [
          {
            db: 'admin',
            user: 'scramSha1',
          },
        ],
      });
    });

    it('Connects with scram (scramOnlyScramSha256)', async function () {
      await testConnection(envs.getConnectionOptions('scramOnlyScramSha256'), {
        authenticatedUserRoles: [
          {
            db: 'admin',
            role: 'readWriteAnyDatabase',
          },
        ],
        authenticatedUsers: [
          {
            db: 'admin',
            user: 'scramSha256',
          },
        ],
      });
    });

    it('Connects with scram (scramEncodedPassword)', async function () {
      await testConnection(envs.getConnectionOptions('scramEncodedPassword'), {
        authenticatedUserRoles: [
          {
            db: 'admin',
            role: 'readWriteAnyDatabase',
          },
        ],
        authenticatedUsers: [
          {
            db: 'admin',
            user: 'randomPassword',
          },
        ],
      });
    });

    it('Connects with scram (scramPrivilegesOnNonExistingDatabases)', async function () {
      await testConnection(
        envs.getConnectionOptions('scramPrivilegesOnNonExistingDatabases'),
        {
          authenticatedUserRoles: [
            {
              db: 'db2',
              role: 'readWrite',
            },
            {
              db: 'db1',
              role: 'read',
            },
            {
              db: 'db3',
              role: 'dbAdmin',
            },
            {
              db: 'db4',
              role: 'dbOwner',
            },
          ],
          authenticatedUsers: [
            {
              db: 'admin',
              user: 'user2',
            },
          ],
        }
      );
    });

    it('Connects with scram (scramPrivilegesOnNonExistingCollections)', async function () {
      await testConnection(
        envs.getConnectionOptions('scramPrivilegesOnNonExistingCollections'),
        {
          authenticatedUserRoles: [
            {
              db: 'sandbox',
              role: 'role1',
            },
          ],
          authenticatedUsers: [
            {
              db: 'admin',
              user: 'customRole',
            },
          ],
        }
      );
    });

    it('Connects with scram (scramAlternateAuthDb)', async function () {
      await testConnection(envs.getConnectionOptions('scramAlternateAuthDb'), {
        authenticatedUserRoles: [{ db: 'authDb', role: 'dbOwner' }],
        authenticatedUsers: [{ db: 'authDb', user: 'authDb' }],
      });
    });
  });

  it('Connects to sharded', async function () {
    await testConnection(envs.getConnectionOptions('sharded'), {
      authenticatedUserRoles: [{ db: 'admin', role: 'root' }],
      authenticatedUsers: [{ db: 'admin', user: 'root' }],
    });
  });

  describe('ssh', function () {
    it('Connects with ssh (sshPassword)', async function () {
      await testConnection(envs.getConnectionOptions('sshPassword'), {
        authenticatedUserRoles: [],
        authenticatedUsers: [],
      });
    });

    it('Connects with ssh (sshIdentityKey)', async function () {
      await testConnection(envs.getConnectionOptions('sshIdentityKey'), {
        authenticatedUserRoles: [],
        authenticatedUsers: [],
      });
    });

    it('Connects with ssh (sshIdentityKeyWithPassphrase)', async function () {
      await testConnection(
        envs.getConnectionOptions('sshIdentityKeyWithPassphrase'),
        { authenticatedUserRoles: [], authenticatedUsers: [] }
      );
    });
  });

  describe('tls', function () {
    it('Connects with tls (tlsUnvalidated)', async function () {
      await testConnection(envs.getConnectionOptions('tlsUnvalidated'), {
        authenticatedUserRoles: [],
        authenticatedUsers: [],
      });
    });

    it('Connects with tls (tlsServerValidation)', async function () {
      await testConnection(envs.getConnectionOptions('tlsServerValidation'), {
        authenticatedUserRoles: [],
        authenticatedUsers: [],
      });
    });

    it('Connects with tls (tlsServerAndClientValidation)', async function () {
      await testConnection(
        envs.getConnectionOptions('tlsServerAndClientValidation'),
        { authenticatedUserRoles: [], authenticatedUsers: [] }
      );
    });

    it('Connects with tls (tlsX509)', async function () {
      await testConnection(envs.getConnectionOptions('tlsX509'), {
        authenticatedUserRoles: [
          { db: 'test', role: 'readWrite' },
          { db: 'admin', role: 'userAdminAnyDatabase' },
        ],
        authenticatedUsers: [
          {
            db: '$external',
            user: 'emailAddress=user@domain.com,CN=client1,OU=clients,O=Organisation,ST=NSW,C=AU',
          },
        ],
      });
    });

    it('Connects with tls (tlsX509WithSsh)', async function () {
      await testConnection(envs.getConnectionOptions('tlsX509WithSsh'), {
        authenticatedUserRoles: [
          { db: 'test', role: 'readWrite' },
          { db: 'admin', role: 'userAdminAnyDatabase' },
        ],
        authenticatedUsers: [
          {
            db: '$external',
            user: 'emailAddress=user@domain.com,CN=client1,OU=clients,O=Organisation,ST=NSW,C=AU',
          },
        ],
      });
    });
  });
});

async function connectAndGetAuthInfo(connectionOptions: ConnectionOptions) {
  let dataService: DataService | undefined;

  try {
    dataService = await connect(connectionOptions);
    const command = util.promisify(dataService.command.bind(dataService));
    const connectionStatus = await command('admin', { connectionStatus: 1 });

    return {
      authenticatedUserRoles:
        connectionStatus.authInfo?.authenticatedUserRoles || [],
      authenticatedUsers: connectionStatus.authInfo?.authenticatedUsers || [],
    };
  } catch (error) {
    throw new Error(
      `Failed to connect to:\n${JSON.stringify(
        connectionOptions,
        null,
        2
      )}\n. Caused by: ${util.inspect(error)}`
    );
  } finally {
    if (dataService) {
      await dataService.disconnect();
    }
  }
}

async function testConnection(
  connectionOptions: ConnectionOptions,
  expected: { authenticatedUsers: any[]; authenticatedUserRoles: any[] }
): Promise<void> {
  const { authenticatedUsers, authenticatedUserRoles } =
    await connectAndGetAuthInfo(connectionOptions);
  expect(authenticatedUsers).to.have.deep.members(expected.authenticatedUsers);
  expect(authenticatedUserRoles).to.have.deep.members(
    expected.authenticatedUserRoles
  );
}
