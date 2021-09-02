// @ts-check
const { expect } = require('chai');
const { beforeTests, afterTests } = require('../helpers/compass');

describe.only('Time to first query', function () {
  this.timeout(1000 * 60 * 1);

  let compass;

  it('can connect connect and run a query', async function() {
    // start compass inside the test so that the time is measured together
    ({ compass } = await beforeTests(false));

    await compass.client.connectWithConnectionString(
      'mongodb://localhost:27018/test'
    );

    const result = await compass.client.shellEval(
      'db.runCommand({ connectionStatus: 1 })',
      true
    );

    expect(result).to.have.property('ok', 1);
  });

  after(function () {

    // cleanup outside of the test so that the time it takes to run does not
    // get added to the time it took to run the first query
    return afterTests({ compass });
  });
});
