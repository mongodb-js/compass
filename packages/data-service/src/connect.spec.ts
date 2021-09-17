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
  // 'kerberos',
  // 'replicaSet',
  // 'tls',
]);

describe.only('connect', function () {
  const connections = {
    enterprise: {
      authenticatedUserRoles: [],
      authenticatedUsers: [],
    },
    ldap: {
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
    },
    scramReadWriteAnyDatabase: {
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
    },
    scramReadWriteAnyDatabaseScramSha1: {
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
    },
    scramReadWriteAnyDatabaseScramSha256: {
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
    },
    scramOnlyScramSha1: {
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
    },
    scramOnlyScramSha256: {
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
    },
    scramEncodedPassword: {
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
    },
    scramPrivilegesOnNonExistingDatabases: {
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
    },
    scramPrivilegesOnNonExistingCollections: {
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
    },
    scramAlternateAuthDb: {
      authenticatedUserRoles: [
        {
          db: 'authDb',
          role: 'dbOwner',
        },
      ],
      authenticatedUsers: [
        {
          db: 'authDb',
          user: 'authDb',
        },
      ],
    },
    sharded: {
      authenticatedUserRoles: [
        {
          db: 'admin',
          role: 'root',
        },
      ],
      authenticatedUsers: [
        {
          db: 'admin',
          user: 'root',
        },
      ],
    },
    sshPassword: {
      authenticatedUserRoles: [],
      authenticatedUsers: [],
    },
    sshIdentityKey: {
      authenticatedUserRoles: [],
      authenticatedUsers: [],
    },
    sshIdentityKeyWithPassphrase: {
      authenticatedUserRoles: [],
      authenticatedUsers: [],
    },
    // tlsUnvalidated: {},
    // tlsServerValidation: {},
    // tlsServerAndClientValidation: {},
    // tlsX509: {},
    // tlsX509WithSsh: {},
    // kerberos: {},
    // kerberosAlternate: {},
    // kerberosCrossRealm: {},
    // replicaSet: {},
    // replicaSetAnaylticsNode: {},
    // replicaSetPrivateNode: {},
  };

  function shouldRunConnectivityTests() {
    // always run on ubuntu in evergreen
    if (process.env.EVERGREEN_BUILD_VARIANT === 'ubuntu') {
      return true;
    }

    // always run on ubuntu in github actions
    if (process.env.CI === 'true' && process.env.RUNNER_OS === 'Linux') {
      return true;
    }

    // allows to run locally
    return ['1', 'true'].includes(
      process.env.COMPASS_RUN_CONNECTIVITY_TESTS as string
    );
  }

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
        await util.promisify(dataService.disconnect.bind(dataService))();
      }
    }
  }

  before(async function () {
    if (!shouldRunConnectivityTests()) {
      return this.skip();
    }

    // 10 minutes
    this.timeout(10 * 60 * 1000);
    console.log('setting up testing environments ...');
    try {
      await envs.setup();
    } catch (e) {
      await envs.teardown();
      throw e;
    }

    console.log('done.');
  });

  after(async function () {
    if (!shouldRunConnectivityTests()) {
      return;
    }

    // 10 minutes
    this.timeout(10 * 60 * 1000);

    console.log('tearing down testing environments ...');
    await envs.teardown();
    console.log('done.');
  });

  // eslint-disable-next-line mocha/no-setup-in-describe
  Object.entries(connections).forEach(
    ([
      connectionId,
      {
        authenticatedUsers: expectedAuthenticatedUsers,
        authenticatedUserRoles: expectedAuthenticatedUserRoles,
      },
    ]) => {
      it(`connects to ${connectionId}`, async function () {
        console.log(`connecting to ${connectionId} ...`);

        this.timeout(1 * 60 * 1000); // 1 minute
        const connectionOptions = envs.getConnectionOptions(connectionId);
        const { authenticatedUsers, authenticatedUserRoles } =
          await connectAndGetAuthInfo(connectionOptions);
        expect(authenticatedUsers).to.have.deep.members(
          expectedAuthenticatedUsers
        );
        expect(authenticatedUserRoles).to.have.deep.members(
          expectedAuthenticatedUserRoles
        );
      });
    }
  );
});
