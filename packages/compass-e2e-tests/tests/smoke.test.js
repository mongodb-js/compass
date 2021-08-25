// @ts-check
const { expect } = require('chai');
const { createUnlockedKeychain } = require('../helpers/keychain');
const {
  startCompass,
  getAtlasConnectionOptions
} = require('../helpers/compass');

/**
 * This test suite is based on compass smoke test matrix
 */
describe('Compass', function () {
  this.timeout(1000 * 60 * 1);

  const keychain = createUnlockedKeychain();
  /** @type {import('../helpers/compass').ExtendedApplication} */
  let compass;

  before(async () => {
    keychain.activate();
    compass = await startCompass();
    await compass.client.waitForConnectionScreen();
    await compass.client.closeTourModal();
    await compass.client.closePrivacySettingsModal();
  });

  after(async () => {
    try {
      if (compass) {
        await compass.stop();
        compass = null;
      }
    } finally {
      keychain.reset();
    }
  });

  describe('Connect screen', () => {
    afterEach(async () => {
      await compass.client.disconnect();
    });

    it('can connect using connection string', async () => {
      await compass.client.connectWithConnectionString(
        'mongodb://localhost:27018/test'
      );
      const result = await compass.client.shellEval(
        'db.runCommand({ connectionStatus: 1 })',
        true
      );
      expect(result).to.have.property('ok', 1);
    });

    it('can connect using connection form', async () => {
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
        30_000
      );
      const result = await compass.client.shellEval(
        'db.runCommand({ connectionStatus: 1 })',
        true
      );
      expect(result).to.have.property('ok', 1);
    });
  });
});
