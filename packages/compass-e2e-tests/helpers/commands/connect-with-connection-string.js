const Selectors = require('../selectors');

module.exports = function (app) {
  return async function connectWithConnectionString(
    connectionString,
    timeout = 10000
  ) {
    const { client } = app;
    await client.setValueVisible(
      Selectors.ConnectionStringInput,
      connectionString
    );
    await client.doConnect(timeout);
  };
};
