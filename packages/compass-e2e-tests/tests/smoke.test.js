// @ts-check
const { expect } = require('chai');
const {
  getAtlasConnectionOptions,
  beforeTests,
  afterTests,
  capturePage,
  savePage,
  screenshotPathName,
  pagePathName,
} = require('../helpers/compass');

/**
 * This test suite is based on compass smoke test matrix
 */
describe('Compass', function () {
  this.timeout(1000 * 60 * 1);

  let keychain;
  /** @type {import('../helpers/compass').ExtendedApplication} */
  let compass;
  let client;

  before(async function () {
    ({ keychain, compass } = await beforeTests(true));
    client = compass.client;
  });

  after(function () {
    return afterTests({ keychain, compass });
  });

  afterEach(async function () {
    if (this.currentTest.state == 'failed') {
      await capturePage(
        compass,
        screenshotPathName(this.currentTest.fullTitle())
      );
      await savePage(compass, pagePathName(this.currentTest.fullTitle()));
    }
  });

  describe('Connect screen', function () {
    afterEach(async function () {
      await client.disconnect();
    });

    it('can connect using connection string', async function () {
      await client.connectWithConnectionString(
        'mongodb://localhost:27018/test'
      );
      const result = await client.shellEval(
        'db.runCommand({ connectionStatus: 1 })',
        true
      );
      expect(result).to.have.property('ok', 1);
    });

    it('can connect using connection form', async function () {
      await client.connectWithConnectionForm({
        host: 'localhost',
        port: 27018,
      });
      const result = await client.shellEval(
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
      await client.connectWithConnectionForm(atlasConnectionOptions, 30_000);
      const result = await client.shellEval(
        'db.runCommand({ connectionStatus: 1 })',
        true
      );
      expect(result).to.have.property('ok', 1);
    });
  });
});
