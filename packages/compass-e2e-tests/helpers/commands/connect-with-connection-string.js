const Selectors = require('../selectors');

module.exports = function(app) {
  return async function connectWithConnectionString(
    connectionString,
    timeout = 10000
  ) {
    await app.client.setValueVisible(
      Selectors.ConnectionStringInput,
      connectionString
    );
    await app.client.doConnect(timeout);
  };
}
