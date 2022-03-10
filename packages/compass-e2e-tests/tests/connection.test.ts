import { spawnSync } from 'child_process';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { expect } from 'chai';
import ConnectionString from 'mongodb-connection-string-url';
import resolveMongodbSrv from 'resolve-mongodb-srv';
import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import type { ConnectFormState } from '../helpers/connect-form-state';

async function disconnect(browser: CompassBrowser) {
  try {
    await browser.disconnect();
  } catch (err) {
    console.error('Error during disconnect:');
    console.error(err);
  }
}

function hasAtlasEnvironmentVariables(): boolean {
  const missingKeys = [
    'E2E_TESTS_ATLAS_HOST',
    'E2E_TESTS_DATA_LAKE_HOST',
    'E2E_TESTS_ANALYTICS_NODE_HOST',
    'E2E_TESTS_SERVERLESS_HOST',
    'E2E_TESTS_FREE_TIER_HOST',
    'E2E_TESTS_ATLAS_USERNAME',
    'E2E_TESTS_ATLAS_PASSWORD',
    'E2E_TESTS_ATLAS_X509_PEM',
    'E2E_TESTS_ATLAS_IAM_ACCESS_KEY_ID',
    'E2E_TESTS_ATLAS_IAM_SECRET_ACCESS_KEY',
    'E2E_TESTS_ATLAS_IAM_TEMP_ROLE_ARN',
    'E2E_TESTS_ATLAS_IAM_USER_ARN',
  ].filter((key) => !process.env[key]);

  if (missingKeys.length > 0) {
    const keysStr = missingKeys.join(', ');
    if (process.env.ci || process.env.CI) {
      throw new Error(`Missing required environmental variable(s): ${keysStr}`);
    }
    return false;
  }

  return true;
}

function basicAtlasOptions(host: string): ConnectFormState {
  const username = process.env.E2E_TESTS_ATLAS_USERNAME ?? '';
  const password = process.env.E2E_TESTS_ATLAS_PASSWORD ?? '';

  const atlasConnectionOptions: ConnectFormState = {
    hosts: [host],
    authMethod: 'DEFAULT',
    defaultUsername: username,
    defaultPassword: password,
    defaultAuthMechanism: 'SCRAM-SHA-1',
    scheme: 'MONGODB_SRV',
  };

  return atlasConnectionOptions;
}

function generateIamSessionToken(): {
  key: string;
  secret: string;
  token: string;
} {
  const result = spawnSync(
    'aws',
    [
      'sts',
      'assume-role',
      '--role-arn',
      process.env.E2E_TESTS_ATLAS_IAM_TEMP_ROLE_ARN ?? '',
      '--role-session-name',
      'MONGODB-AWS-AUTH-TEST',
      '--duration-seconds',
      '900', // test timeout is 120, waitForX is 10. minimum allowed value is 900.
    ],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        AWS_ACCESS_KEY_ID: process.env.E2E_TESTS_ATLAS_IAM_ACCESS_KEY_ID ?? '',
        AWS_SECRET_ACCESS_KEY:
          process.env.E2E_TESTS_ATLAS_IAM_SECRET_ACCESS_KEY ?? '',
      },
    }
  );
  if (result.status !== 0) {
    console.error('Failed to run aws sts assume-role', result);
    throw new Error('Failed to run aws sts assume-role');
  }

  const parsedToken = JSON.parse(result.stdout);
  const key = parsedToken?.Credentials?.AccessKeyId;
  const secret = parsedToken?.Credentials?.SecretAccessKey;
  const token = parsedToken?.Credentials?.SessionToken;
  if (!key || !secret || !token) {
    throw new Error(
      'Could not determine key, token, or secret from sts assume-role output'
    );
  }
  return {
    key,
    secret,
    token,
  };
}

/**
 * Connection tests
 */
describe('Connection screen', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await beforeTests();
    browser = compass.browser;
  });

  after(function () {
    return afterTests(compass, this.currentTest);
  });

  afterEach(async function () {
    await disconnect(browser);
    await afterTest(compass, this.currentTest);
  });

  it('can connect using connection string', async function () {
    await browser.connectWithConnectionString('mongodb://localhost:27018/test');
    const result = await browser.shellEval(
      'db.runCommand({ connectionStatus: 1 })',
      true
    );
    expect(result).to.have.property('ok', 1);
  });

  it('can connect using connection form', async function () {
    await browser.connectWithConnectionForm({
      hosts: ['localhost:27018'],
    });
    const result = await browser.shellEval(
      'db.runCommand({ connectionStatus: 1 })',
      true
    );
    expect(result).to.have.property('ok', 1);
  });

  it('can connect to an Atlas cluster with username/password authentication (SCRAM-SHA-1)', async function () {
    if (!hasAtlasEnvironmentVariables()) {
      return this.skip();
    }

    const atlasConnectionOptions: ConnectFormState = basicAtlasOptions(
      process.env.E2E_TESTS_ATLAS_HOST ?? ''
    );

    await browser.connectWithConnectionForm(atlasConnectionOptions);
    const result = await browser.shellEval(
      'db.runCommand({ connectionStatus: 1 })',
      true
    );
    expect(result).to.have.property('ok', 1);
  });

  it('can connect to an Atlas cluster with X.509 authentication', async function () {
    if (!hasAtlasEnvironmentVariables()) {
      return this.skip();
    }

    let tempdir;
    try {
      tempdir = await fs.mkdtemp(path.join(os.tmpdir(), 'connect-tests-'));
      const certPath = path.join(tempdir, 'x509.pem');
      await fs.writeFile(certPath, process.env.E2E_TESTS_ATLAS_X509_PEM ?? '');

      const atlasConnectionOptions: ConnectFormState = {
        hosts: [process.env.E2E_TESTS_ATLAS_HOST ?? ''],
        authMethod: 'MONGODB-X509',
        scheme: 'MONGODB_SRV',
        sslConnection: 'ON',
        tlsCertificateKeyFile: certPath,
      };

      await browser.connectWithConnectionForm(atlasConnectionOptions);
      const result = await browser.shellEval(
        'db.runCommand({ connectionStatus: 1 })',
        true
      );
      expect(result).to.have.property('ok', 1);
    } finally {
      if (tempdir) {
        await fs.rmdir(tempdir, { recursive: true });
      }
    }
  });

  it('can connect to an Atlas cluster with AWS IAM authentication (without session token)', async function () {
    if (!hasAtlasEnvironmentVariables()) {
      return this.skip();
    }

    const atlasConnectionOptions: ConnectFormState = {
      hosts: [process.env.E2E_TESTS_FREE_TIER_HOST ?? ''],
      authMethod: 'MONGODB-AWS',
      scheme: 'MONGODB_SRV',
      awsAccessKeyId: process.env.E2E_TESTS_ATLAS_IAM_ACCESS_KEY_ID ?? '',
      awsSecretAccessKey:
        process.env.E2E_TESTS_ATLAS_IAM_SECRET_ACCESS_KEY ?? '',
    };

    await browser.connectWithConnectionForm(atlasConnectionOptions);
    const result = await browser.shellEval(
      'db.runCommand({ connectionStatus: 1 })',
      true
    );
    expect(result).to.have.property('ok', 1);
  });

  it('can connect to an Atlas cluster with AWS IAM authentication (including session token)', async function () {
    if (!hasAtlasEnvironmentVariables()) {
      return this.skip();
    }

    if (process.env.EVERGREEN && process.platform === 'win32') {
      // TODO: https://jira.mongodb.org/browse/COMPASS-5575
      console.warn("Evergreen doesn't have aws cli installed");
      this.skip();
    }

    console.log('generating session token');
    const { key, secret, token } = generateIamSessionToken();

    const atlasConnectionOptions: ConnectFormState = {
      hosts: [process.env.E2E_TESTS_FREE_TIER_HOST ?? ''],
      authMethod: 'MONGODB-AWS',
      scheme: 'MONGODB_SRV',
      awsAccessKeyId: key,
      awsSecretAccessKey: secret,
      awsSessionToken: token,
    };

    await browser.connectWithConnectionForm(atlasConnectionOptions);
    const result = await browser.shellEval(
      'db.runCommand({ connectionStatus: 1 })',
      true
    );
    expect(result).to.have.property('ok', 1);
  });

  it('can connect to an Atlas replicaset without srv', async function () {
    if (!hasAtlasEnvironmentVariables()) {
      return this.skip();
    }

    const username = process.env.E2E_TESTS_ATLAS_USERNAME ?? '';
    const password = process.env.E2E_TESTS_ATLAS_PASSWORD ?? '';
    const host = process.env.E2E_TESTS_ATLAS_HOST ?? '';
    const withSRV = `mongodb+srv://${username}:${password}@${host}`;

    const connectionString = await resolveMongodbSrv(withSRV);

    await browser.connectWithConnectionString(connectionString);
    const result = await browser.shellEval(
      'db.runCommand({ connectionStatus: 1 })',
      true
    );
    expect(result).to.have.property('ok', 1);
  });

  it('can connect to an Atlas cluster with a direct connection', async function () {
    if (!hasAtlasEnvironmentVariables()) {
      return this.skip();
    }

    const username = process.env.E2E_TESTS_ATLAS_USERNAME ?? '';
    const password = process.env.E2E_TESTS_ATLAS_PASSWORD ?? '';
    const host = process.env.E2E_TESTS_ATLAS_HOST ?? '';
    const withSRV = `mongodb+srv://${username}:${password}@${host}`;

    const withoutSRV = await resolveMongodbSrv(withSRV);

    const parsedString = new ConnectionString(withoutSRV);
    parsedString.hosts = [parsedString.hosts[0]];
    parsedString.searchParams.set('directConnection', 'true');
    parsedString.searchParams.delete('replicaSet');

    const connectionString = parsedString.toString();

    await browser.connectWithConnectionString(connectionString);
    const result = await browser.shellEval(
      'db.runCommand({ connectionStatus: 1 })',
      true
    );
    expect(result).to.have.property('ok', 1);
  });

  it('can connect to Atlas Serverless', async function () {
    if (!hasAtlasEnvironmentVariables()) {
      return this.skip();
    }

    const atlasConnectionOptions: ConnectFormState = basicAtlasOptions(
      process.env.E2E_TESTS_SERVERLESS_HOST ?? ''
    );

    await browser.connectWithConnectionForm(atlasConnectionOptions);
    const result = await browser.shellEval(
      'db.runCommand({ connectionStatus: 1 })',
      true
    );
    expect(result).to.have.property('ok', 1);
  });

  it('can connect to Atlas Datalake', async function () {
    if (!hasAtlasEnvironmentVariables()) {
      return this.skip();
    }

    const atlasConnectionOptions: ConnectFormState = basicAtlasOptions(
      process.env.E2E_TESTS_DATA_LAKE_HOST ?? ''
    );
    atlasConnectionOptions.scheme = 'MONGODB';
    atlasConnectionOptions.defaultDatabase = 'test';
    atlasConnectionOptions.sslConnection = 'ON';
    atlasConnectionOptions.defaultAuthSource = 'admin';

    await browser.connectWithConnectionForm(atlasConnectionOptions);
    const result = await browser.shellEval(
      'db.runCommand({ connectionStatus: 1 })',
      true
    );
    expect(result).to.have.property('ok', 1);
  });

  it('can connect to Atlas Analytics Node', async function () {
    if (!hasAtlasEnvironmentVariables()) {
      return this.skip();
    }

    const atlasConnectionOptions: ConnectFormState = basicAtlasOptions(
      process.env.E2E_TESTS_ANALYTICS_NODE_HOST ?? ''
    );

    await browser.connectWithConnectionForm(atlasConnectionOptions);
    const result = await browser.shellEval(
      'db.runCommand({ connectionStatus: 1 })',
      true
    );
    expect(result).to.have.property('ok', 1);
  });

  it('can connect to Atlas Free Tier', async function () {
    if (!hasAtlasEnvironmentVariables()) {
      return this.skip();
    }

    const atlasConnectionOptions: ConnectFormState = basicAtlasOptions(
      process.env.E2E_TESTS_FREE_TIER_HOST ?? ''
    );

    await browser.connectWithConnectionForm(atlasConnectionOptions);
    const result = await browser.shellEval(
      'db.runCommand({ connectionStatus: 1 })',
      true
    );
    expect(result).to.have.property('ok', 1);
  });
});

// eslint-disable-next-line mocha/max-top-level-suites
describe('SRV connectivity', function () {
  it('resolves SRV connection string using OS DNS APIs', async function () {
    const compass = await beforeTests();
    const browser = compass.browser;

    try {
      // Does not actually succeed at connecting, but that’s fine for us here
      // (Unless you have a server listening on port 27017)
      await browser.connectWithConnectionString(
        'mongodb+srv://test1.test.build.10gen.cc/test?tls=false',
        undefined,
        'either'
      );
    } finally {
      // make sure the browser gets closed otherwise if this fails the process wont exit
      await afterTests(compass);
    }

    const { logs } = compass;

    // Find information about which DNS resolutions happened and how:
    const resolutionLogs = logs
      .filter(
        (log) => log.id === 1_000_000_039 && log.ctx === 'compass-connect'
      )
      .map((log) => log.attr);

    expect(resolutionLogs).to.have.lengthOf(1);

    const { from, to, resolutionDetails } = resolutionLogs[0];
    const fromCS = new ConnectionString(from);
    const toCS = new ConnectionString(to);
    fromCS.searchParams.delete('appname');
    toCS.searchParams.delete('appname');
    toCS.hosts.sort();
    expect(fromCS.href).to.equal(
      'mongodb+srv://test1.test.build.10gen.cc/test?tls=false'
    );
    expect(toCS.href).to.equal(
      'mongodb://localhost.test.build.10gen.cc,localhost.test.build.10gen.cc:27018/test?tls=false'
    );

    expect(resolutionDetails).to.have.lengthOf(2);
    const srvResolution = resolutionDetails.find((q: any) => q.query === 'SRV');
    const txtResolution = resolutionDetails.find((q: any) => q.query === 'TXT');
    expect(srvResolution).to.deep.equal({
      query: 'SRV',
      hostname: '_mongodb._tcp.test1.test.build.10gen.cc',
      error: null,
      wasNativelyLookedUp: true,
    });
    txtResolution.error = !!txtResolution.error; // Do not assert exact error message
    expect(txtResolution).to.deep.equal({
      query: 'TXT',
      hostname: 'test1.test.build.10gen.cc',
      error: true,
      wasNativelyLookedUp: false, // Due to fallback to Node.js API after resolution error
    });
  });
});
