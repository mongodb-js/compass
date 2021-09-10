// @ts-check
const { expect } = require('chai');
const { beforeTests, afterTests } = require('../helpers/compass');

describe('Time to first query', function () {
  this.timeout(1000 * 60 * 1);

  let keychain;
  let compass;

  it('can open compass and connect to a database', async function () {
    // start compass inside the test so that the time is measured together
    ({ keychain, compass } = await beforeTests());

    await compass.client.connectWithConnectionString(
      'mongodb://localhost:27018/test'
    );

    const result = await compass.client.shellEval(
      'db.runCommand({ connectionStatus: 1 })',
      true
    );

    expect(result).to.have.property('ok', 1);
  });

  // eslint-disable-next-line mocha/no-hooks-for-single-case
  after(function () {
    // cleanup outside of the test so that the time it takes to run does not
    // get added to the time it took to run the first query
    return afterTests({ keychain, compass });
  });
});
