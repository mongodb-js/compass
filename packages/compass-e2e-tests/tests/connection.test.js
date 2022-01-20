const { expect } = require('chai');
const ConnectionString = require('mongodb-connection-string-url').default;
const {
  getAtlasConnectionOptions,
  beforeTests,
  afterTests,
  afterTest,
} = require('../helpers/compass');

async function disconnect(browser) {
  try {
    await browser.disconnect();
  } catch (err) {
    console.error('Error during disconnect:');
    console.error(err);
  }
}

/**
 * Connection tests
 */
describe('Connection screen', function () {
  let compass;
  let browser;

  before(async function () {
    compass = await beforeTests();
    browser = compass.browser;
  });

  after(function () {
    return afterTests(compass);
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
      host: 'localhost',
      port: 27018,
    });
    const result = await browser.shellEval(
      'db.runCommand({ connectionStatus: 1 })',
      true
    );
    expect(result).to.have.property('ok', 1);
  });

  it('can connect to Atlas cluster', async function () {
    const atlasConnectionOptions = getAtlasConnectionOptions();
    if (!atlasConnectionOptions) {
      return this.skip();
    }
    await browser.connectWithConnectionForm(atlasConnectionOptions);
    const result = await browser.shellEval(
      'db.runCommand({ connectionStatus: 1 })',
      true
    );
    expect(result).to.have.property('ok', 1);
  });
});

describe('SRV connectivity', function () {
  it('resolves SRV connection string using OS DNS APIs', async function () {
    if (process.platform === 'win32') {
      // TODO: re-enable this test on windows
      return;
    }

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
      await disconnect(browser);
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
      'mongodb+srv://test1.test.build.10gen.cc/test?readPreference=primary&ssl=false'
    );
    expect(toCS.href).to.equal(
      'mongodb://localhost.test.build.10gen.cc,localhost.test.build.10gen.cc:27018/test?readPreference=primary&ssl=false'
    );

    expect(resolutionDetails).to.have.lengthOf(2);
    const srvResolution = resolutionDetails.find((q) => q.query === 'SRV');
    const txtResolution = resolutionDetails.find((q) => q.query === 'TXT');
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

    // The connection attempt was aborted early.
    expect(logs.filter((log) => log.id === 1_000_000_036)).to.have.lengthOf(1);
  });
});
