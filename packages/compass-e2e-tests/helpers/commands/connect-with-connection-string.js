const Selectors = require('../selectors');

const defaultTimeoutMS = 30_000;

module.exports = function (app, page, commands) {
  return async function connectWithConnectionString(
    connectionString,
    timeout = defaultTimeoutMS
  ) {
    await page.fill(
      Selectors.ConnectionStringInput,
      connectionString
    );
    console.log('connecting with string');
    await commands.doConnect(timeout);
  };
};
