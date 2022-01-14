// TODO: ts-check
const { expect } = require('chai');
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
