// @ts-check
const { expect } = require('chai');
const {
  getAtlasConnectionOptions,
  beforeTests,
  afterTests,
  afterTest,
} = require('../helpers/compass');

async function disconnect(commands) {
  try {
    await commands.disconnect();
  } catch (err) {
    console.error('Error during disconnect:');
    console.error(err);
  }
}

/**
 * Connection tests
 */
describe.only('Connection screen', function () {
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
    await disconnect(commands);
    await afterTest(app, page, this.currentTest);
  });

  it('can connect using connection string', async function () {
    await commands.connectWithConnectionString('mongodb://localhost:27018/test');
    const result = await commands.shellEval(
      'db.runCommand({ connectionStatus: 1 })',
      true
    );
    expect(result).to.have.property('ok', 1);
  });

  it('can connect using connection form', async function () {
    await commands.connectWithConnectionForm({
      host: 'localhost',
      port: 27018,
    });
    const result = await commands.shellEval(
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
    await commands.connectWithConnectionForm(atlasConnectionOptions);
    const result = await commands.shellEval(
      'db.runCommand({ connectionStatus: 1 })',
      true
    );
    expect(result).to.have.property('ok', 1);
  });
});
