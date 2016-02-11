var NativeClient = require('./native-client');

/**
 * Instantiate a new DataService object.
 *
 * @constructor
 * @param {Connection} connection - The Connection model.
 */
function DataService(connection) {
  this.client = new NativeClient(connection);
}

module.exports = DataService;
