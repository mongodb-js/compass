// @ts-check
const { expect } = require('chai');
const {
  getAtlasConnectionOptions,
  beforeTests,
  afterTests,
  afterTest,
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
    ({ keychain, compass } = await beforeTests());
    client = compass.client;
  });

  after(function () {
    return afterTests({ keychain, compass });
  });

  describe('Connect screen', function () {
    afterEach(async function () {
      await afterTest(compass, this.currentTest);

      try {
        await client.disconnect();
      } catch (err) {
        console.error('Error during disconnect:');
        console.error(err);
      }
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
