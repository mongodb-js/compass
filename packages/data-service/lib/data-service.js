var NativeClient = require('./native-client');

/**
 * Instantiate a new DataService object.
 */
function DataService(connection) {
  this.client = new NativeClient(connection);
}

module.exports = DataService;
