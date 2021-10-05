const Selectors = require('../selectors');

module.exports = function (app) {
  return async function connectWithConnectionString(connectionString, timeout) {
    const { client } = app;
    await client.setValueVisible(
      Selectors.ConnectionStringInput,
      connectionString
    );
    await client.doConnect(timeout);
  };
};
