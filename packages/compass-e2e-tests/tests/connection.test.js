// @ts-check
const { expect } = require('chai');
const {
  getAtlasConnectionOptions,
  beforeTests,
  afterTests,
  afterTest,
} = require('../helpers/compass');

async function disconnect(client) {
  try {
    await client.disconnect();
  } catch (err) {
    console.error('Error during disconnect:');
    console.error(err);
  }
}

/**
 * Connection tests
 */
describe.skip('Connection screen', function () {
  /** @type {import('../helpers/compass').ExtendedApplication} */
  let app;
  let page;
  let commands;

  before(async function () {
    ({ app, page, commands } = await beforeTests());
  });

  after(function () {
    return afterTests(app, page);
  });

  afterEach(async function () {
    await disconnect(client);
    await afterTest(app, page, this.currentTest);
  });

  it('can connect using connection string', async function () {
    await client.connectWithConnectionString('mongodb://localhost:27018/test');
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
    await client.connectWithConnectionForm(atlasConnectionOptions);
    const result = await client.shellEval(
      'db.runCommand({ connectionStatus: 1 })',
      true
    );
    expect(result).to.have.property('ok', 1);
  });
});
