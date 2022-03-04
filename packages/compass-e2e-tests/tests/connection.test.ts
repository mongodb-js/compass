import { expect } from 'chai';
import ConnectionString from 'mongodb-connection-string-url';
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
    defaultAuthMechanism: 'DEFAULT',
    scheme: 'MONGODB_SRV',
  };

  return atlasConnectionOptions;
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

  it('can connect to an Atlas cluster with username/password authentication', async function () {
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

  it('can connect to an Atlas cluster with X.509 authentication');
  it('can connect to an Atlas cluster with AWS IAM authentication');

  it('can connect to an Atlas cluster a direct connection');
  it('can connect to an Atlas replicaset without srv');

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

  // TODO: SCRAM-SHA-x?
  // Kerberos?
  // LDAP?
  // Different authdb?
  // SSH with password?
  // SSH with identity file?
  // Socks5?
  // Advanced options?
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
