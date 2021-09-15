// @ts-check
const { expect } = require('chai');
const {
  getAtlasConnectionOptions,
  beforeTests,
  afterTests,
  afterTest,
} = require('../helpers/compass');
const Selectors = require('../helpers/selectors');

async function disconnect(client) {
  try {
    await client.disconnect();
  } catch (err) {
    console.error('Error during disconnect:');
    console.error(err);
  }
}

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

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  describe('Connect screen', function () {
    it('can connect using connection string', async function () {
      try {
        await client.connectWithConnectionString(
          'mongodb://localhost:27018/test'
        );
        const result = await client.shellEval(
          'db.runCommand({ connectionStatus: 1 })',
          true
        );
        expect(result).to.have.property('ok', 1);
      } finally {
        await disconnect();
      }
    });

    it('can connect using connection form', async function () {
      try {
        await client.connectWithConnectionForm({
          host: 'localhost',
          port: 27018,
        });
        const result = await client.shellEval(
          'db.runCommand({ connectionStatus: 1 })',
          true
        );
        expect(result).to.have.property('ok', 1);
      } finally {
        await disconnect();
      }
    });

    it('can connect to Atlas cluster', async function () {
      try {
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
      } finally {
        await disconnect();
      }
    });
  });

  describe('localhost:27018', () => {

    before(async () => {
      await client.connectWithConnectionString(
        'mongodb://localhost:27018/test'
      );
    });

    describe('Sidebar', () => {

      it('contains cluster info', async () => {

        const topologySingleHostAddress = await client.getText(Selectors.TopologySingleHostAddress);
        expect(topologySingleHostAddress).to.equal('localhost:27018');

        const singleClusterType = await client.getText(Selectors.SingleClusterType);
        expect(singleClusterType).to.equal('Standalone');

        const serverVersionText = await client.getText(Selectors.ServerVersionText);
        expect(serverVersionText).to.equal('MongoDB 5.0.2 Community'); // this will fail every time we update
      });

      it('contains a dbs/collections tree view');
      it('can search for a collection');
      it('can create a database and drop it');
      it('can create a collection and drop it');
      it('can edit a favourite');
    });

    describe('Interface screen', () => {
    });

    describe('Database screen', () => {

    });

    describe('Documents tab', () => {
    });

    describe('Aggregations tab', () => {
    });

    describe('Schema tab', () => {
    });

    describe('Explain plan tab', () => {

    });

    describe('Indexes tab', () => {

    });

    describe('Validation tab', () => {

    });

    describe('Import', () => {

    });

    describe('Export', () => {

    });

    describe('Compass Shell', () => {

    });
  });
});
