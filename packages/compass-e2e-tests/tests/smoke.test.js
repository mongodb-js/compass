// @ts-check
const { expect } = require('chai');
const {
  getAtlasConnectionOptions,
  beforeTests,
  afterTests
} = require('../helpers/compass');

/**
 * This test suite is based on compass smoke test matrix
 */
describe('Compass', function () {
  this.timeout(1000 * 60 * 1);

  let keychain;
  /** @type {import('../helpers/compass').ExtendedApplication} */
  let compass;

  before(async function () {
    ({ keychain, compass } = await beforeTests(keychain));
  });

  after(function () {
    return afterTests(keychain, compass);
  });

  describe('Connect screen', function () {
    afterEach(async function () {
      await compass.client.disconnect();
    });

    it('can connect using connection string', async function () {
      await compass.client.connectWithConnectionString(
        'mongodb://localhost:27018/test'
      );
      const result = await compass.client.shellEval(
        'db.runCommand({ connectionStatus: 1 })',
        true
      );
      expect(result).to.have.property('ok', 1);
    });

    it('can connect using connection form', async function () {
      await compass.client.connectWithConnectionForm({
        host: 'localhost',
        port: 27018
      });
      const result = await compass.client.shellEval(
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
      await compass.client.connectWithConnectionForm(
        atlasConnectionOptions,
        30000
      );
      const result = await compass.client.shellEval(
        'db.runCommand({ connectionStatus: 1 })',
        true
      );
      expect(result).to.have.property('ok', 1);
    });
  });
});
