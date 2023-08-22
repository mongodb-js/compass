const createTestEnvs = require('@mongodb-js/devtools-docker-test-envs').default;
const ConnectionStringUrl = require('mongodb-connection-string-url').default;
const { extractSecrets } = require('@mongodb-js/connection-storage/main');
const uuidV5 = require('uuid/v5');
const { app } = require('electron');
const fs = require('fs').promises;
const keytar = require('keytar');
const path = require('path');
const prompts = require('prompts');

const {
  E2E_TESTS_ATLAS_USERNAME,
  E2E_TESTS_ATLAS_PASSWORD,
  E2E_TESTS_ATLAS_HOST,
  E2E_TESTS_DATA_LAKE_HOST,
  E2E_TESTS_SERVERLESS_HOST,
  E2E_TESTS_FREE_TIER_HOST,
  E2E_TESTS_ANALYTICS_NODE_HOST,
  E2E_TESTS_ATLAS_X509_PEM_PATH,
} = process.env;

const buildConnectionString = (scheme, username, password, host, params) => {
  if (!username || !password || !host) {
    return '';
  }

  const url = new ConnectionStringUrl(`${scheme}://${host}/admin`);
  url.username = username;
  url.password = password;

  if (params) {
    url.search = new URLSearchParams(params).toString();
  }

  return url.href;
};

const COMPASS_TEST_ATLAS_URL = buildConnectionString(
  'mongodb+srv',
  E2E_TESTS_ATLAS_USERNAME,
  E2E_TESTS_ATLAS_PASSWORD,
  E2E_TESTS_ATLAS_HOST
);

const COMPASS_TEST_FREE_TIER_URL = buildConnectionString(
  'mongodb+srv',
  E2E_TESTS_ATLAS_USERNAME,
  E2E_TESTS_ATLAS_PASSWORD,
  E2E_TESTS_FREE_TIER_HOST
);

const COMPASS_TEST_ANALYTICS_NODE_URL = buildConnectionString(
  'mongodb+srv',
  E2E_TESTS_ATLAS_USERNAME,
  E2E_TESTS_ATLAS_PASSWORD,
  E2E_TESTS_ANALYTICS_NODE_HOST,
  {
    readConcernLevel: 'local',
    readPreference: 'secondary',
    readPreferenceTags: 'nodeType:ANALYTICS',
  }
);

const COMPASS_TEST_SECONDARY_NODE_URL = buildConnectionString(
  'mongodb+srv',
  E2E_TESTS_ATLAS_USERNAME,
  E2E_TESTS_ATLAS_PASSWORD,
  E2E_TESTS_ANALYTICS_NODE_HOST,
  {
    readPreference: 'secondary',
  }
);

const COMPASS_TEST_DATA_LAKE_URL = buildConnectionString(
  'mongodb',
  E2E_TESTS_ATLAS_USERNAME,
  E2E_TESTS_ATLAS_PASSWORD,
  E2E_TESTS_DATA_LAKE_HOST,
  { tls: 'true' }
);

const COMPASS_TEST_SERVERLESS_URL = buildConnectionString(
  'mongodb+srv',
  E2E_TESTS_ATLAS_USERNAME,
  E2E_TESTS_ATLAS_PASSWORD,
  E2E_TESTS_SERVERLESS_HOST
);

const envs = createTestEnvs([
  'enterprise',
  'ldap',
  'scram',
  'sharded',
  'ssh',
  'tls',
  'kerberos',
]);

const connections = [];

if (COMPASS_TEST_ATLAS_URL) {
  connections.push({
    favorite: {
      name: 'Atlas',
    },
    connectionOptions: {
      connectionString: COMPASS_TEST_ATLAS_URL,
    },
  });
}

if (COMPASS_TEST_FREE_TIER_URL) {
  connections.push({
    favorite: {
      name: 'Atlas (free tier)',
    },
    connectionOptions: {
      connectionString: COMPASS_TEST_FREE_TIER_URL,
    },
  });
}

if (COMPASS_TEST_SECONDARY_NODE_URL) {
  connections.push({
    favorite: {
      name: 'Atlas (ReadPreference=Secondary)',
    },
    connectionOptions: {
      connectionString: COMPASS_TEST_SECONDARY_NODE_URL,
    },
  });
}

if (COMPASS_TEST_ANALYTICS_NODE_URL) {
  connections.push({
    favorite: {
      name: 'Atlas (nodeType:ANALYTICS)',
    },
    connectionOptions: {
      connectionString: COMPASS_TEST_ANALYTICS_NODE_URL,
    },
  });
}

if (E2E_TESTS_ATLAS_HOST && E2E_TESTS_ATLAS_X509_PEM_PATH) {
  const url = new ConnectionStringUrl(
    `mongodb+srv://${E2E_TESTS_ATLAS_HOST || ''}/admin`
  );

  url.searchParams.set('authMechanism', 'MONGODB-X509');
  url.searchParams.set('tls', 'true');
  url.searchParams.set('tlsCertificateKeyFile', E2E_TESTS_ATLAS_X509_PEM_PATH);
  url.searchParams.set('authSource', '$external');

  connections.push({
    favorite: {
      name: 'Atlas (X509)',
    },
    connectionOptions: {
      connectionString: url.href,
    },
  });
}

if (COMPASS_TEST_DATA_LAKE_URL) {
  connections.push({
    favorite: {
      name: 'Atlas Data Lake',
    },
    connectionOptions: {
      connectionString: COMPASS_TEST_DATA_LAKE_URL,
    },
  });
}

if (COMPASS_TEST_SERVERLESS_URL) {
  connections.push({
    favorite: {
      name: 'Atlas Serverless',
    },
    connectionOptions: {
      connectionString: COMPASS_TEST_SERVERLESS_URL,
    },
  });
}

[
  'enterprise',
  'ldap',
  'scramReadWriteAnyDatabase',
  'scramReadWriteAnyDatabaseScramSha1',
  'scramReadWriteAnyDatabaseScramSha256',
  'scramOnlyScramSha1',
  'scramOnlyScramSha256',
  'scramEncodedPassword',
  'scramPrivilegesOnNonExistingDatabases',
  'scramPrivilegesOnNonExistingCollections',
  'scramAlternateAuthDb',
  'sharded',
  'sshPassword',
  'sshIdentityKey',
  'sshIdentityKeyWithPassphrase',
  'sshReplicaSetSeedlist',
  'sshReplicaSetByReplSetName',
  'tlsUnvalidated',
  'tlsServerValidation',
  'tlsServerValidationSsh',
  'tlsServerAndClientValidation',
  'tlsServerAndClientValidationKeyCrt',
  'tlsX509',
  'tlsX509WithSsh',
  'kerberos',
  'kerberosAlternate',
  'kerberosCrossRealm',
].forEach((envName) =>
  connections.push({
    favorite: {
      name: envName,
    },
    connectionOptions: envs.getConnectionOptions(envName),
  })
);

async function main() {
  const channels = {
    dev: 'MongoDB Compass Dev',
    beta: 'MongoDB Compass Beta',
    stable: 'MongoDB Compass',
  };

  const channel = process.argv[2] || 'dev';

  if (!Object.keys(channels).includes(channel)) {
    throw new Error(
      `USAGE: electron scripts/import-test-connections.js ${Object.keys(
        channels
      ).join('|')}`
    );
  }

  const appName = channels[channel];

  const { shouldContinue } = await prompts([
    {
      type: 'confirm',
      name: 'shouldContinue',
      message: `You are about to import ${connections.length} connections in ${appName}, you will be prompted to unlock the keychain multiple times on the next startup, do you want to continue?`,
      initial: false,
    },
  ]);

  if (!shouldContinue) {
    process.exit(0);
  }

  const userData = path.dirname(app.getPath('userData'));
  const destDir = path.join(userData, appName, 'Connections');

  for (const connectionInfo of connections) {
    try {
      const uuidNamespace = '35facdc4-d338-4015-b8f8-38e5d9ebeca4';
      const connectionInfoWithId = {
        ...connectionInfo,
        id: uuidV5(JSON.stringify(connectionInfo), uuidNamespace),
      };
      const serviceName = `${appName}/Connections`;
      const accountName = connectionInfoWithId.id;

      const { secrets, connectionInfo: connectionInfoWithoutSecrets } =
        extractSecrets(connectionInfoWithId);

      await keytar.setPassword(
        serviceName,
        accountName,
        JSON.stringify(secrets)
      );
      await fs.writeFile(
        path.join(destDir, `${connectionInfoWithId.id}.json`),
        JSON.stringify({
          connectionInfo: connectionInfoWithoutSecrets,
        })
      );

      console.log('Saved', connectionInfo.favorite.name);
    } catch (e) {
      console.log(e);
    }
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
