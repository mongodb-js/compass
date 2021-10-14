const Selectors = require('../selectors');

const defaultTimeoutMS = 30_000;

module.exports = function (app) {
  return async function connectWithConnectionString(
    connectionString,
    timeout = defaultTimeoutMS
  ) {
    const { client } = app;
    await client.setValueVisible(
      Selectors.ConnectionStringInput,
      connectionString
    );
    await client.doConnect(timeout);
  };
};
