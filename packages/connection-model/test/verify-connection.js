var assert = require('assert');
/**
 * This function is used in authentication tests to verify that
 * the Connection model creates a valid connection URL and
 * and options object.
 *
 * @param {Connection} connection - An object specifying all parameters for the db connection
 * @param {string} expectedURL - The URL that we expect to the connection to create
 * @param {object} expectedOptions - An object holding various options for the db connection
 * @param {function} done - Test Callback
 */
module.exports = function(connection, expectedURL, expectedOptions, done) {
  assert.equal(connection.uri, expectedURL);
  assert.deepEqual(connection.options, expectedOptions);
  done();
};
